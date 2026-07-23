import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AccessContextService, AuthenticatedUserRef } from '../auth/access-context.service';
import { AnalyticsQueryDto, EntityMetricsQueryDto } from './dto/analytics-query.dto';
import { RecordAnalyticsEventDto } from './dto/record-analytics-event.dto';
import { AnalyticsRepository } from './repositories/analytics.repository';

type MetricModel = 'dailyMetric' | 'hourlyMetric' | 'campaignMetric' | 'brokerMetric' | 'managerMetric' | 'whatsappMetric';

@Injectable()
export class AnalyticsService {
  constructor(private readonly access: AccessContextService, private readonly repository: AnalyticsRepository) {}

  daily(query: AnalyticsQueryDto, user: AuthenticatedUserRef) { return this.metrics('dailyMetric', query, user); }
  hourly(query: AnalyticsQueryDto, user: AuthenticatedUserRef) { return this.metrics('hourlyMetric', query, user); }
  campaigns(query: EntityMetricsQueryDto, user: AuthenticatedUserRef) { return this.metrics('campaignMetric', query, user, query.campaignId ? { campaignId: query.campaignId } : {}); }
  brokers(query: EntityMetricsQueryDto, user: AuthenticatedUserRef) { return this.metrics('brokerMetric', query, user, query.userId ? { brokerUserId: query.userId } : {}); }
  managers(query: EntityMetricsQueryDto, user: AuthenticatedUserRef) { return this.metrics('managerMetric', query, user, query.userId ? { managerUserId: query.userId } : {}); }
  whatsapp(query: EntityMetricsQueryDto, user: AuthenticatedUserRef) { return this.metrics('whatsappMetric', query, user, query.whatsappAccountId ? { whatsappAccountId: query.whatsappAccountId } : {}); }

  async recordEvent(data: RecordAnalyticsEventDto) {
    return this.repository.createEvent(data);
  }

  private async metrics(model: MetricModel, query: AnalyticsQueryDto, user: AuthenticatedUserRef, extra: Prisma.JsonObject = {}) {
    const ctx = await this.access.resolve(user);
    const organizationId = ctx.global ? query.organizationId : ctx.organizationId;
    if (!organizationId) throw new ForbiddenException('Organização obrigatória para consultar analytics');
    const where: Prisma.JsonObject = { organizationId, ...extra };
    if (query.from || query.to) where.bucketStart = { ...(query.from ? { gte: new Date(query.from) } : {}), ...(query.to ? { lte: new Date(query.to) } : {}) } as any;
    return this.repository.list(model, where, query as EntityMetricsQueryDto);
  }
}
