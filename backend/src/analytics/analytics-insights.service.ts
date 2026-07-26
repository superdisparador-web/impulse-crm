import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CampaignRecipientStatus, Prisma, Role } from '@prisma/client';
import { AccessContextService, AuthenticatedUserRef } from '../auth/access-context.service';
import { PrismaService } from '../prisma/prisma.service';
import { ANALYTICS_LIMITS, averageMilliseconds, rate } from './analytics-kpis';
import { AnalyticsQueryDto, EntityMetricsQueryDto } from './dto/analytics-query.dto';

const activeCampaignStatuses = ['SCHEDULED', 'PROCESSING'] as const;

@Injectable()
export class AnalyticsInsightsService {
  constructor(private readonly prisma: PrismaService, private readonly access: AccessContextService) {}

  async executive(query: AnalyticsQueryDto, user: AuthenticatedUserRef) {
    const organizationId = await this.organization(query.organizationId, user);
    const createdAt = this.period(query);
    const campaignWhere = { organizationId, deletedAt: null, ...(createdAt ? { createdAt } : {}) } satisfies Prisma.CampaignWhereInput;
    const eventWhere = { organizationId, ...(createdAt ? { occurredAt: createdAt } : {}) } satisfies Prisma.AnalyticsEventWhereInput;
    const [campaigns, statusGroups, conversions, temporal, recentEvents, operationalAlerts] = await Promise.all([
      this.prisma.campaign.findMany({ where: campaignWhere, select: { id: true, name: true, status: true, totalContacts: true, totalSent: true, totalDelivered: true, totalRead: true, totalClicked: true, totalFailed: true, startedAt: true, finishedAt: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.campaign.groupBy({ by: ['status'], where: campaignWhere, _count: { _all: true } }),
      this.prisma.deal.count({ where: { organizationId, status: 'WON', ...(createdAt ? { wonAt: createdAt } : {}) } }),
      this.prisma.dailyMetric.findMany({ where: { organizationId, ...(createdAt ? { bucketStart: createdAt } : {}) }, orderBy: { bucketStart: 'asc' }, take: ANALYTICS_LIMITS.maxPageSize }),
      this.prisma.analyticsEvent.findMany({ where: eventWhere, orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }], take: ANALYTICS_LIMITS.recentEventsSize }),
      this.prisma.messageQueue.findMany({ where: { organizationId, status: { in: ['FAILED', 'RETRYING'] }, ...(createdAt ? { createdAt } : {}) }, select: { id: true, campaignId: true, status: true, lastError: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: ANALYTICS_LIMITS.recentEventsSize }),
    ]);
    const totals = campaigns.reduce((sum, campaign) => ({ contacts: sum.contacts + campaign.totalContacts, sent: sum.sent + campaign.totalSent, delivered: sum.delivered + campaign.totalDelivered, read: sum.read + campaign.totalRead, clicked: sum.clicked + campaign.totalClicked, failed: sum.failed + campaign.totalFailed }), { contacts: 0, sent: 0, delivered: 0, read: 0, clicked: 0, failed: 0 });
    const status = Object.fromEntries(statusGroups.map((item) => [item.status, item._count._all]));
    const ranking = campaigns.map((campaign) => ({ id: campaign.id, name: campaign.name, sent: campaign.totalSent, ctr: rate(campaign.totalClicked, campaign.totalDelivered), readRate: rate(campaign.totalRead, campaign.totalDelivered), deliveryRate: rate(campaign.totalDelivered, campaign.totalSent), conversionRate: rate(conversions, totals.contacts) })).sort((a, b) => b.ctr - a.ctr || b.readRate - a.readRate).slice(0, ANALYTICS_LIMITS.rankingSize);
    return {
      campaigns: { active: (status.SCHEDULED ?? 0) + (status.PROCESSING ?? 0), completed: status.COMPLETED ?? 0, paused: status.PAUSED ?? 0, canceled: status.CANCELED ?? 0 },
      messages: totals,
      rates: { ctr: rate(totals.clicked, totals.delivered), readRate: rate(totals.read, totals.delivered), deliveryRate: rate(totals.delivered, totals.sent), conversionRate: rate(conversions, totals.contacts) },
      conversions,
      averageCampaignTimeMs: averageMilliseconds(campaigns.map((campaign) => ({ start: campaign.startedAt, end: campaign.finishedAt }))),
      inProgress: campaigns.filter((campaign) => activeCampaignStatuses.includes(campaign.status as typeof activeCampaignStatuses[number])),
      ranking,
      temporal,
      recentEvents,
      operationalAlerts,
    };
  }

  async funnel(campaignId: string, query: AnalyticsQueryDto, user: AuthenticatedUserRef) {
    const organizationId = await this.organization(query.organizationId, user);
    const campaign = await this.prisma.campaign.findFirst({ where: { id: campaignId, organizationId, deletedAt: null }, select: { id: true, name: true } });
    if (!campaign) throw new NotFoundException('Campanha não encontrada');
    const recipients = await this.prisma.campaignRecipient.findMany({ where: { campaignId, organizationId }, select: { status: true, sentAt: true, deliveredAt: true, readAt: true, clickedAt: true, leadId: true } });
    const leadIds = recipients.flatMap((recipient) => recipient.leadId ? [recipient.leadId] : []);
    const [conversations, deals] = await Promise.all([
      this.prisma.whatsappConversation.findMany({ where: { organizationId, leadId: { in: leadIds }, deletedAt: null }, select: { leadId: true, createdAt: true } }),
      this.prisma.deal.findMany({ where: { organizationId, leadId: { in: leadIds } }, select: { leadId: true, status: true, stage: { select: { name: true } }, createdAt: true, wonAt: true } }),
    ]);
    const atLeast = (statuses: CampaignRecipientStatus[]) => recipients.filter((recipient) => statuses.includes(recipient.status)).length;
    const values = [
      { key: 'sent', label: 'Enviado', value: atLeast(['SENT', 'DELIVERED', 'READ', 'CLICKED']) },
      { key: 'delivered', label: 'Entregue', value: atLeast(['DELIVERED', 'READ', 'CLICKED']) },
      { key: 'read', label: 'Lido', value: atLeast(['READ', 'CLICKED']) },
      { key: 'click', label: 'Clique', value: atLeast(['CLICKED']) },
      { key: 'service', label: 'Atendimento', value: new Set(conversations.map((item) => item.leadId)).size },
      { key: 'visit', label: 'Visita', value: new Set(deals.filter((deal) => /visit/i.test(deal.stage.name)).map((deal) => deal.leadId)).size },
      { key: 'documentation', label: 'Documentação', value: new Set(deals.filter((deal) => /document/i.test(deal.stage.name)).map((deal) => deal.leadId)).size },
      { key: 'sale', label: 'Venda', value: new Set(deals.filter((deal) => deal.status === 'WON').map((deal) => deal.leadId)).size },
    ];
    const stages = values.map((stage, index) => ({ ...stage, stepRate: index === 0 ? 100 : rate(stage.value, values[index - 1].value), cumulativeRate: rate(stage.value, values[0].value), abandonment: index === 0 ? 0 : values[index - 1].value - stage.value }));
    const bottleneck = stages.slice(1).sort((a, b) => a.stepRate - b.stepRate)[0] ?? null;
    return { campaign, stages, bottleneck, averageDeliveryTimeMs: averageMilliseconds(recipients.map((recipient) => ({ start: recipient.sentAt, end: recipient.deliveredAt }))), averageReadTimeMs: averageMilliseconds(recipients.map((recipient) => ({ start: recipient.deliveredAt, end: recipient.readAt }))) };
  }

  async templates(query: EntityMetricsQueryDto, user: AuthenticatedUserRef) {
    const organizationId = await this.organization(query.organizationId, user);
    const campaigns = await this.prisma.campaign.findMany({ where: { organizationId, deletedAt: null, whatsappTemplateId: { not: null }, ...(this.period(query) ? { createdAt: this.period(query) } : {}) }, select: { whatsappTemplateId: true, createdAt: true, totalSent: true, totalDelivered: true, totalRead: true, totalClicked: true, recipients: { select: { lead: { select: { convertedAt: true } } } }, whatsappTemplate: { select: { id: true, displayName: true, name: true } } } });
    const grouped = new Map<string, { id: string; name: string; campaigns: number; used: number; sent: number; delivered: number; read: number; clicked: number; conversions: number; lastUsedAt: Date }>();
    for (const campaign of campaigns) {
      if (!campaign.whatsappTemplateId || !campaign.whatsappTemplate) continue;
      const current = grouped.get(campaign.whatsappTemplateId) ?? { id: campaign.whatsappTemplateId, name: campaign.whatsappTemplate.displayName || campaign.whatsappTemplate.name, campaigns: 0, used: 0, sent: 0, delivered: 0, read: 0, clicked: 0, conversions: 0, lastUsedAt: campaign.createdAt };
      current.campaigns += 1; current.used += campaign.totalSent; current.sent += campaign.totalSent; current.delivered += campaign.totalDelivered; current.read += campaign.totalRead; current.clicked += campaign.totalClicked; current.conversions += campaign.recipients.filter((recipient) => recipient.lead?.convertedAt).length; if (campaign.createdAt > current.lastUsedAt) current.lastUsedAt = campaign.createdAt;
      grouped.set(campaign.whatsappTemplateId, current);
    }
    return [...grouped.values()].map((item) => ({ ...item, ctr: rate(item.clicked, item.delivered), deliveryRate: rate(item.delivered, item.sent), readRate: rate(item.read, item.delivered), conversionRate: rate(item.conversions, item.sent) })).sort((a, b) => b.conversionRate - a.conversionRate || b.ctr - a.ctr);
  }

  async events(query: EntityMetricsQueryDto, user: AuthenticatedUserRef) {
    const organizationId = await this.organization(query.organizationId, user);
    const page = query.page ?? 1; const limit = query.limit ?? ANALYTICS_LIMITS.defaultPageSize;
    const where = { organizationId, ...(this.period(query) ? { occurredAt: this.period(query) } : {}), ...(query.campaignId ? { campaignId: query.campaignId } : {}) } satisfies Prisma.AnalyticsEventWhereInput;
    const [items, total] = await Promise.all([this.prisma.analyticsEvent.findMany({ where, orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * limit, take: limit }), this.prisma.analyticsEvent.count({ where })]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  private async organization(requested: string | undefined, user: AuthenticatedUserRef) {
    const ctx = await this.access.resolve(user);
    const organizationId = ctx.global ? requested : ctx.organizationId;
    if (!organizationId || (!ctx.global && requested && requested !== ctx.organizationId)) throw new ForbiddenException('Organização obrigatória para consultar analytics');
    if (ctx.role === Role.BROKER && requested && requested !== ctx.organizationId) throw new ForbiddenException('Escopo inválido');
    return organizationId;
  }

  private period(query: AnalyticsQueryDto): Prisma.DateTimeFilter | undefined {
    return query.from || query.to ? { ...(query.from ? { gte: new Date(query.from) } : {}), ...(query.to ? { lte: new Date(query.to) } : {}) } : undefined;
  }
}
