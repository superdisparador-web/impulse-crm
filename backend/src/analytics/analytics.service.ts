import { ForbiddenException, Injectable } from '@nestjs/common';
import { AnalyticsEventSource, Prisma, Role } from '@prisma/client';
import { AccessContextService, AuthenticatedUserRef } from '../auth/access-context.service';
import { AnalyticsDomainEvent, ANALYTICS_EVENT_TYPES } from './analytics-domain-event';
import { AnalyticsQueryDto, EntityMetricsQueryDto } from './dto/analytics-query.dto';
import { RecordAnalyticsEventDto } from './dto/record-analytics-event.dto';
import { AnalyticsRepository } from './repositories/analytics.repository';

type MetricModel = 'daily' | 'hourly' | 'campaign' | 'broker' | 'manager' | 'whatsapp';
type OverviewRow = { leads: number; campaigns: number; distributions: number; whatsappSent: number; whatsappRead: number; conversions: number };

@Injectable()
export class AnalyticsService {
  constructor(private readonly access: AccessContextService, private readonly repository: AnalyticsRepository) {}

  daily(query: AnalyticsQueryDto, user: AuthenticatedUserRef) { return this.metrics('daily', query, user); }
  hourly(query: AnalyticsQueryDto, user: AuthenticatedUserRef) { return this.metrics('hourly', query, user); }
  campaigns(query: EntityMetricsQueryDto, user: AuthenticatedUserRef) { return this.metrics('campaign', query, user, query.campaignId ? { campaignId: query.campaignId } : {}); }
  brokers(query: EntityMetricsQueryDto, user: AuthenticatedUserRef) { return this.metrics('broker', query, user, query.userId ? { brokerUserId: query.userId } : {}); }
  managers(query: EntityMetricsQueryDto, user: AuthenticatedUserRef) { return this.metrics('manager', query, user, query.userId ? { managerUserId: query.userId } : {}); }
  whatsapp(query: EntityMetricsQueryDto, user: AuthenticatedUserRef) { return this.metrics('whatsapp', query, user, query.whatsappAccountId ? { whatsappAccountId: query.whatsappAccountId } : {}); }

  async overview(query: AnalyticsQueryDto, user: AuthenticatedUserRef) {
    const rows = await this.daily(query, user) as OverviewRow[];
    return { interval: { from: query.from ?? null, to: query.to ?? null }, leads: this.sum(rows, 'leads'), campaigns: this.sum(rows, 'campaigns'), distributions: this.sum(rows, 'distributions'), whatsappSent: this.sum(rows, 'whatsappSent'), whatsappRead: this.sum(rows, 'whatsappRead'), conversions: this.sum(rows, 'conversions') };
  }

  async recordEvent(data: RecordAnalyticsEventDto) {
    const event: AnalyticsDomainEvent = { organizationId: data.organizationId, source: data.source.toUpperCase() as AnalyticsEventSource, eventType: data.eventType, occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(), idempotencyKey: data.idempotencyKey ?? `${data.eventType}:${data.organizationId}:${data.occurredAt ?? Date.now()}`, leadId: data.leadId, campaignId: data.campaignId, brokerUserId: data.brokerUserId, managerUserId: data.managerUserId, whatsappAccountId: data.whatsappAccountId, distributionId: data.distributionId, dealId: data.dealId, metadata: data.metadata };
    return this.recordDomainEvent(event);
  }

  async recordDomainEvent(event: AnalyticsDomainEvent) {
    if (!event.organizationId || !ANALYTICS_EVENT_TYPES.includes(event.eventType)) throw new ForbiddenException('Evento de analytics inválido');
    try { return await this.repository.createEvent(event); }
    catch (error) { if (this.isUniqueConflict(error)) return { duplicate: true, idempotencyKey: event.idempotencyKey }; throw error; }
  }

  private async metrics(model: MetricModel, query: AnalyticsQueryDto, user: AuthenticatedUserRef, extra: Record<string, string> = {}) {
    const ctx = await this.access.resolve(user);
    const organizationId = ctx.global ? query.organizationId : ctx.organizationId;
    if (!organizationId || (!ctx.global && organizationId !== ctx.organizationId)) throw new ForbiddenException('Organização obrigatória para consultar analytics');
    if (ctx.role === Role.BROKER && model === 'broker' && extra.brokerUserId && extra.brokerUserId !== ctx.id) throw new ForbiddenException('Corretor só pode consultar os próprios indicadores');
    const scopedExtra = ctx.role === Role.BROKER && model === 'broker' && !extra.brokerUserId ? { brokerUserId: ctx.id } : extra;
    const bucketStart = query.from || query.to ? { ...(query.from ? { gte: new Date(query.from) } : {}), ...(query.to ? { lte: new Date(query.to) } : {}) } : undefined;
    if (model === 'daily') return this.repository.listDaily({ organizationId, ...(bucketStart ? { bucketStart } : {}) }, query);
    if (model === 'hourly') return this.repository.listHourly({ organizationId, ...(bucketStart ? { bucketStart } : {}) }, query);
    if (model === 'campaign') return this.repository.listCampaign({ organizationId, ...scopedExtra, ...(bucketStart ? { bucketStart } : {}) }, query as EntityMetricsQueryDto);
    if (model === 'broker') return this.repository.listBroker({ organizationId, ...scopedExtra, ...(bucketStart ? { bucketStart } : {}) }, query as EntityMetricsQueryDto);
    if (model === 'manager') return this.repository.listManager({ organizationId, ...scopedExtra, ...(bucketStart ? { bucketStart } : {}) }, query as EntityMetricsQueryDto);
    return this.repository.listWhatsapp({ organizationId, ...scopedExtra, ...(bucketStart ? { bucketStart } : {}) }, query as EntityMetricsQueryDto);
  }

  private sum(rows: OverviewRow[], key: keyof OverviewRow) { return rows.reduce((total, row) => total + row[key], 0); }
  private isUniqueConflict(error: unknown) { return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'; }
}
