import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MediaService } from './media.service';
import { inboundTypeMap, MetaChangeValue, MetaInboundMessage } from './webhook.types';

@Injectable()
export class InboundMessageService {
  constructor(private readonly prisma: PrismaService, private readonly mediaService: MediaService) {}

  async process(phoneNumberId: string | undefined, whatsappAccountId: string | undefined, organizationId: string | undefined, value: MetaChangeValue, tx: Prisma.TransactionClient = this.prisma) {
    const contacts = new Map((value.contacts ?? []).map((contact) => [contact.wa_id, contact.profile?.name]));
    await Promise.all((value.messages ?? []).map((message) => this.saveMessage(phoneNumberId, whatsappAccountId, organizationId, message, contacts.get(message.from), tx)));
  }

  private async saveMessage(phoneNumberId: string | undefined, whatsappAccountId: string | undefined, organizationId: string | undefined, message: MetaInboundMessage, customerName: string | undefined, tx: Prisma.TransactionClient) {
    const type = inboundTypeMap[message.type ?? ''] ?? 'UNKNOWN';
    const text = this.extractText(message);
    const receivedAt = message.timestamp ? new Date(Number(message.timestamp) * 1000) : new Date();
    const inbound = await tx.inboundMessage.upsert({
      where: { metaMessageId: message.id },
      create: { whatsappAccountId, organizationId, phoneNumberId, from: message.from, customerName, metaMessageId: message.id, type, text, payload: message as Prisma.InputJsonValue, receivedAt },
      update: { organizationId, customerName, text, payload: message as Prisma.InputJsonValue },
    });
    if (['AUDIO', 'IMAGE', 'VIDEO', 'DOCUMENT', 'STICKER'].includes(type)) await this.mediaService.prepareMedia(inbound.id, message, tx);
  }

  private extractText(message: MetaInboundMessage) {
    if (message.text?.body) return message.text.body;
    if (message.button?.text) return message.button.text;
    if (message.reaction?.emoji) return message.reaction.emoji;
    if (message.type === 'interactive' && message.interactive) return JSON.stringify(message.interactive);
    if (message.type === 'location' && message.location) return [message.location.name, message.location.address].filter(Boolean).join(' - ') || undefined;
    return undefined;
  }
}
