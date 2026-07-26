import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const timelineEventInclude = { actorUser: { select: { id: true, name: true, email: true } } } satisfies Prisma.LeadEventInclude;

@Injectable()
export class TimelineService {
  constructor(private readonly prisma: PrismaService) {}

  async forLead(leadId: string, organizationId: string) {
    const [leadEvents, recipients, messages, dealEvents] = await Promise.all([
      this.prisma.leadEvent.findMany({ where: { leadId, organizationId }, include: timelineEventInclude, orderBy: { occurredAt: 'desc' } }),
      this.prisma.campaignRecipient.findMany({ where: { leadId, organizationId }, select: { id: true, status: true, sentAt: true, deliveredAt: true, readAt: true, clickedAt: true, failedAt: true, campaign: { select: { id: true, name: true } } } }),
      this.prisma.whatsappMessage.findMany({ where: { leadId, organizationId }, select: { id: true, direction: true, status: true, sentAt: true, deliveredAt: true, readAt: true, failedAt: true, createdAt: true, conversation: { select: { assignedUser: { select: { id: true, name: true } } } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.dealEvent.findMany({ where: { organizationId, deal: { leadId } }, include: { actorUser: { select: { id: true, name: true, email: true } }, deal: { select: { id: true, title: true } } }, orderBy: { occurredAt: 'desc' } }),
    ]);

    const campaignItems = recipients.flatMap((recipient) => [
      recipient.sentAt && { id: `${recipient.id}:sent`, source: 'CAMPAIGNS' as const, type: 'SENT', occurredAt: recipient.sentAt, campaign: recipient.campaign },
      recipient.deliveredAt && { id: `${recipient.id}:delivered`, source: 'CAMPAIGNS' as const, type: 'DELIVERED', occurredAt: recipient.deliveredAt, campaign: recipient.campaign },
      recipient.readAt && { id: `${recipient.id}:read`, source: 'CAMPAIGNS' as const, type: 'READ', occurredAt: recipient.readAt, campaign: recipient.campaign },
      recipient.clickedAt && { id: `${recipient.id}:clicked`, source: 'CAMPAIGNS' as const, type: 'CLICKED', occurredAt: recipient.clickedAt, campaign: recipient.campaign },
      recipient.failedAt && { id: `${recipient.id}:failed`, source: 'CAMPAIGNS' as const, type: 'ERROR', occurredAt: recipient.failedAt, campaign: recipient.campaign },
    ].filter((item): item is NonNullable<typeof item> => Boolean(item)));

    const items = [
      ...leadEvents.map((event) => ({ id: event.id, source: 'LEADS' as const, type: event.eventType, occurredAt: event.occurredAt, event })),
      ...campaignItems,
      ...messages.map((message) => ({ id: message.id, source: 'WHATSAPP' as const, type: message.direction === 'INBOUND' ? 'FIRST_SERVICE' : message.status, occurredAt: message.sentAt ?? message.createdAt, message })),
      ...dealEvents.map((event) => ({ id: event.id, source: 'PIPELINE' as const, type: event.eventType, occurredAt: event.occurredAt, event })),
    ].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

    return {
      leadId,
      items,
      note: 'TimelineService consolida dinamicamente eventos existentes e não armazena dados próprios.',
    };
  }
}
