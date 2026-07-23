import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EntityMetricsQueryDto } from '../dto/analytics-query.dto';
import { RecordAnalyticsEventDto } from '../dto/record-analytics-event.dto';

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(model: string, where: Prisma.JsonObject, query: EntityMetricsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 100;
    return (this.prisma as any)[model].findMany({ where, orderBy: { bucketStart: query.order ?? 'desc' }, skip: (page - 1) * limit, take: limit });
  }

  createEvent(data: RecordAnalyticsEventDto) {
    return (this.prisma as any).analyticsEvent.create({
      data: {
        organizationId: data.organizationId,
        source: data.source.toUpperCase(),
        eventType: data.eventType,
        leadId: data.leadId,
        campaignId: data.campaignId,
        brokerUserId: data.brokerUserId,
        managerUserId: data.managerUserId,
        whatsappAccountId: data.whatsappAccountId,
        idempotencyKey: data.idempotencyKey,
        occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
        metadata: data.metadata as Prisma.InputJsonObject,
      },
    });
  }
}
