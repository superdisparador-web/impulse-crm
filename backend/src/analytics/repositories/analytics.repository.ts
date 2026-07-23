import { Injectable } from '@nestjs/common';
import { AnalyticsEvent, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsDomainEvent } from '../analytics-domain-event';
import { AnalyticsQueryDto, EntityMetricsQueryDto } from '../dto/analytics-query.dto';

const DEFAULT_LIMIT = 100;

type Order = 'asc' | 'desc';

type MetricListArgs<TWhere> = {
  where: TWhere;
  orderBy: { bucketStart: Order };
  skip: number;
  take: number;
};

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listDaily(where: Prisma.DailyMetricWhereInput, query: AnalyticsQueryDto) {
    return this.prisma.dailyMetric.findMany(this.listArgs(where, query));
  }

  listHourly(where: Prisma.HourlyMetricWhereInput, query: AnalyticsQueryDto) {
    return this.prisma.hourlyMetric.findMany(this.listArgs(where, query));
  }

  listCampaign(where: Prisma.CampaignMetricWhereInput, query: EntityMetricsQueryDto) {
    return this.prisma.campaignMetric.findMany(this.listArgs(where, query));
  }

  listBroker(where: Prisma.BrokerMetricWhereInput, query: EntityMetricsQueryDto) {
    return this.prisma.brokerMetric.findMany(this.listArgs(where, query));
  }

  listManager(where: Prisma.ManagerMetricWhereInput, query: EntityMetricsQueryDto) {
    return this.prisma.managerMetric.findMany(this.listArgs(where, query));
  }

  listWhatsapp(where: Prisma.WhatsappMetricWhereInput, query: EntityMetricsQueryDto) {
    return this.prisma.whatsappMetric.findMany(this.listArgs(where, query));
  }

  createEvent(event: AnalyticsDomainEvent) {
    return this.prisma.analyticsEvent.create({
      data: {
        organizationId: event.organizationId,
        source: event.source,
        eventType: event.eventType,
        leadId: event.leadId ?? undefined,
        campaignId: event.campaignId ?? undefined,
        brokerUserId: event.brokerUserId ?? undefined,
        managerUserId: event.managerUserId ?? undefined,
        whatsappAccountId: event.whatsappAccountId ?? undefined,
        distributionId: event.distributionId ?? undefined,
        dealId: event.dealId ?? undefined,
        idempotencyKey: event.idempotencyKey,
        occurredAt: event.occurredAt,
        metadata: event.metadata as Prisma.InputJsonObject | undefined,
      },
    });
  }

  async claimPendingEvents(limit = DEFAULT_LIMIT) {
    return this.prisma.analyticsEvent.count({ where: { processedAt: null }, take: limit });
  }

  async processEvent(apply: (tx: Prisma.TransactionClient, event: AnalyticsEvent) => Promise<void>) {
    return this.prisma.$transaction(async (tx) => {
      const [event] = await tx.$queryRaw<AnalyticsEvent[]>`
        SELECT *
        FROM "analytics_events"
        WHERE "processedAt" IS NULL
        ORDER BY "occurredAt" ASC, "id" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      `;

      if (!event) return false;
      await apply(tx, event);
      await tx.analyticsEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } });
      return true;
    });
  }

  private listArgs<TWhere>(where: TWhere, query: AnalyticsQueryDto): MetricListArgs<TWhere> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const order = (query as EntityMetricsQueryDto).order ?? 'desc';
    return { where, orderBy: { bucketStart: order }, skip: (page - 1) * limit, take: limit };
  }
}
