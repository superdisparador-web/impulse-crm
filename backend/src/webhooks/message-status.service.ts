import { Injectable } from '@nestjs/common';
import { CampaignRecipientStatus, MetaMessageStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MetaStatus, statusMap } from './webhook.types';

const recipientStatus: Record<MetaMessageStatus, CampaignRecipientStatus> = { SENT: 'SENT', DELIVERED: 'DELIVERED', READ: 'READ', FAILED: 'FAILED', CANCELED: 'SKIPPED' };

@Injectable()
export class MessageStatusService {
  constructor(private readonly prisma: PrismaService) {}

  async process(phoneNumberId: string | undefined, whatsappAccountId: string | undefined, organizationId: string | undefined, statuses: MetaStatus[], tx: Prisma.TransactionClient = this.prisma) {
    if (!statuses.length) return;
    const validStatuses = statuses.map((status) => ({ raw: status, mapped: statusMap[status.status] })).filter((item): item is { raw: MetaStatus; mapped: MetaMessageStatus } => Boolean(item.mapped));
    if (!validStatuses.length) return;

    await Promise.all(validStatuses.map(({ raw, mapped }) => this.recordHistory(phoneNumberId, whatsappAccountId, organizationId, raw, mapped, tx)));

    if (!organizationId) return;
    const recipients = await tx.campaignRecipient.findMany({ where: { messageId: { in: validStatuses.map(({ raw }) => raw.id) }, campaign: { organizationId } }, select: { id: true, campaignId: true, messageId: true } });
    if (!recipients.length) return;
    const statusByMessageId = new Map(validStatuses.map(({ raw, mapped }) => [raw.id, { raw, mapped }]));
    await Promise.all(recipients.map((recipient) => {
      const status = statusByMessageId.get(recipient.messageId ?? '');
      return status ? tx.campaignRecipient.update({ where: { id: recipient.id }, data: this.buildRecipientUpdate(status.raw, status.mapped) }) : Promise.resolve();
    }));
    await Promise.all([...new Set(recipients.map((recipient) => recipient.campaignId))].map((campaignId) => this.recountCampaign(tx, campaignId)));
  }

  private recordHistory(phoneNumberId: string | undefined, whatsappAccountId: string | undefined, organizationId: string | undefined, status: MetaStatus, mapped: MetaMessageStatus, tx: Prisma.TransactionClient) {
    const occurredAt = status.timestamp ? new Date(Number(status.timestamp) * 1000) : new Date();
    return tx.messageStatusHistory.upsert({
      where: { metaMessageId_status_occurredAt: { metaMessageId: status.id, status: mapped, occurredAt } },
      create: { whatsappAccountId, organizationId, phoneNumberId, metaMessageId: status.id, status: mapped, recipientPhone: status.recipient_id, conversationId: status.conversation?.id, pricing: status.pricing as Prisma.InputJsonValue, errors: status.errors as Prisma.InputJsonValue, rawPayload: status as Prisma.InputJsonValue, occurredAt },
      update: { errors: status.errors as Prisma.InputJsonValue, rawPayload: status as Prisma.InputJsonValue },
    });
  }

  private buildRecipientUpdate(status: MetaStatus, mapped: MetaMessageStatus) {
    const occurredAt = status.timestamp ? new Date(Number(status.timestamp) * 1000) : new Date();
    const data: Prisma.CampaignRecipientUpdateInput = { status: recipientStatus[mapped] };
    if (mapped === 'SENT') data.sentAt = occurredAt;
    if (mapped === 'DELIVERED') data.deliveredAt = occurredAt;
    if (mapped === 'READ') data.readAt = occurredAt;
    if (mapped === 'FAILED') { data.failedAt = occurredAt; data.errorMessage = status.errors ? JSON.stringify(status.errors).slice(0, 1000) : undefined; }
    return data;
  }

  private async recountCampaign(tx: Prisma.TransactionClient, campaignId: string) {
    const grouped = await tx.campaignRecipient.groupBy({ by: ['status'], where: { campaignId }, _count: { _all: true } });
    const totals = new Map(grouped.map((group) => [group.status, group._count._all]));
    await tx.campaign.update({ where: { id: campaignId }, data: { totalQueued: totals.get('QUEUED') ?? 0, totalSent: totals.get('SENT') ?? 0, totalDelivered: totals.get('DELIVERED') ?? 0, totalRead: totals.get('READ') ?? 0, totalFailed: totals.get('FAILED') ?? 0, totalClicked: totals.get('CLICKED') ?? 0 } });
  }
}
