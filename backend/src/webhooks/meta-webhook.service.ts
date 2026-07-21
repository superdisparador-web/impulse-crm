import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { InboundMessageService } from './inbound-message.service';
import { MessageStatusService } from './message-status.service';
import { MetaChangeValue, MetaWebhookPayload } from './webhook.types';

@Injectable()
export class MetaWebhookService {
  constructor(private readonly config: ConfigService, private readonly prisma: PrismaService, private readonly inbound: InboundMessageService, private readonly statuses: MessageStatusService) {}

  async verify(mode?: string, token?: string, challenge?: string) {
    const verifyToken = this.config.get<string>('META_WEBHOOK_VERIFY_TOKEN');
    if (!verifyToken) throw new UnauthorizedException('Webhook não configurado');
    if (mode !== 'subscribe' || !token || !challenge) throw new UnauthorizedException('Parâmetros de verificação inválidos');
    if (!this.safeEqual(token, verifyToken)) throw new UnauthorizedException('Token de verificação inválido');
    return challenge;
  }

  validateSignature(signature: string | undefined, rawBody: Buffer | undefined, appSecret: string | undefined) {
    if (!signature || !rawBody || !appSecret) return undefined;
    const expected = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
    return this.safeEqual(signature, expected);
  }

  async process(payload: unknown, signatureValid?: boolean) {
    if (signatureValid === false) throw new UnauthorizedException('Assinatura inválida');
    const metaPayload = this.validatePayload(payload);
    const changes = metaPayload.entry.flatMap((entry) => entry.changes ?? []).map((change) => change.value).filter((value): value is MetaChangeValue => Boolean(value));
    if (!changes.length) throw new BadRequestException('Payload sem alterações processáveis');
    const accountByPhoneNumberId = await this.getAccountsByPhoneNumberId(changes);
    await Promise.all(changes.map((value) => this.processChange(value, accountByPhoneNumberId.get(value.metadata?.phone_number_id ?? ''), signatureValid)));
    return { success: true };
  }

  private validatePayload(payload: unknown): MetaWebhookPayload & { entry: NonNullable<MetaWebhookPayload['entry']> } {
    if (!payload || typeof payload !== 'object') throw new BadRequestException('Payload inválido');
    const metaPayload = payload as MetaWebhookPayload;
    if (!Array.isArray(metaPayload.entry) || !metaPayload.entry.length) throw new BadRequestException('Payload inválido');
    return metaPayload as MetaWebhookPayload & { entry: NonNullable<MetaWebhookPayload['entry']> };
  }

  private async getAccountsByPhoneNumberId(changes: MetaChangeValue[]) {
    const phoneNumberIds = [...new Set(changes.map((change) => change.metadata?.phone_number_id).filter((id): id is string => Boolean(id)))];
    if (!phoneNumberIds.length) return new Map<string, { id: string; organizationId: string }>();
    const accounts = await this.prisma.whatsappAccount.findMany({ where: { phoneNumberId: { in: phoneNumberIds }, deletedAt: null }, select: { id: true, phoneNumberId: true, organizationId: true } });
    return new Map(accounts.map((account) => [account.phoneNumberId, { id: account.id, organizationId: account.organizationId }]));
  }

  private async processChange(value: MetaChangeValue, account: { id: string; organizationId: string } | undefined, signatureValid?: boolean) {
    const phoneNumberId = value.metadata?.phone_number_id;
    const whatsappAccountId = account?.id;
    const organizationId = account?.organizationId;
    const eventTypes = this.detectEventTypes(value);
    await this.prisma.$transaction(async (tx) => {
      if (eventTypes.length) {
        await tx.webhookEvent.createMany({
          data: eventTypes.map((eventType) => ({ eventType, whatsappAccountId, organizationId, phoneNumberId, metaMessageId: this.getMetaMessageId(value, eventType), payload: value as Prisma.InputJsonValue, signatureValid })),
        });
      }
      await this.inbound.process(phoneNumberId, whatsappAccountId, organizationId, value, tx);
      await this.statuses.process(phoneNumberId, whatsappAccountId, organizationId, value.statuses ?? [], tx);
    });
  }

  private detectEventTypes(value: MetaChangeValue) {
    const messageTypes = (value.messages ?? []).map((message) => message.type ?? 'message');
    return [...new Set([...messageTypes, ...(value.statuses?.length ? ['statuses'] : []), ...(value.contacts?.length ? ['contacts'] : []), ...(value.errors?.length ? ['errors'] : [])])];
  }

  private getMetaMessageId(value: MetaChangeValue, eventType: string) {
    return value.messages?.find((message) => (message.type ?? 'message') === eventType)?.id ?? value.messages?.[0]?.id ?? value.statuses?.[0]?.id;
  }

  private safeEqual(received: string, expected: string) {
    const receivedBuffer = Buffer.from(received);
    const expectedBuffer = Buffer.from(expected);
    return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
  }
}
