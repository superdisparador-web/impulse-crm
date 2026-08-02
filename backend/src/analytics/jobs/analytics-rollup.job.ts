import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AnalyticsEvent, Prisma } from '@prisma/client';
import { AnalyticsRepository } from '../repositories/analytics.repository';

type IncrementData = Record<string, { increment: number }>;

@Injectable()
export class AnalyticsRollupJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AnalyticsRollupJob.name);
  private timer?: NodeJS.Timeout;
  private activeExecutions = 0;
  private executionSequence = 0;

  constructor(private readonly repository: AnalyticsRepository) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.runOnce(), 60_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async runOnce(limit = 100) {
    const executionId = `analytics-rollup-${++this.executionSequence}`;
    const startedAt = new Date();
    const startTime = Date.now();
    let processed = 0;
    let transactionsExecuted = 0;
    let errors = 0;
    this.activeExecutions += 1;

    this.logTelemetry('ROLLUP_EXECUTION_STARTED', {
      executionId,
      timestamp: startedAt.toISOString(),
      simultaneousExecutions: this.activeExecutions,
      limit,
    });
    if (this.activeExecutions > 1) {
      this.logTelemetry('ROLLUP_OVERLAP_DETECTED', {
        executionId,
        timestamp: startedAt.toISOString(),
        simultaneousExecutions: this.activeExecutions,
      });
    }

    try {
      for (let index = 0; index < limit; index += 1) {
        transactionsExecuted += 1;
        try {
          const didProcess = await this.repository.processEvent((tx, event) => this.incrementMetrics(tx, event));
          if (!didProcess) break;
          processed += 1;
        } catch (error) {
          errors += 1;
          this.logger.error('Analytics rollup failed', { error });
        }
      }
      return { processed };
    } finally {
      const finishedAt = new Date();
      this.activeExecutions -= 1;
      this.logTelemetry('ROLLUP_EXECUTION_FINISHED', {
        executionId,
        timestamp: finishedAt.toISOString(),
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: Date.now() - startTime,
        eventsProcessed: processed,
        transactionsExecuted,
        errors,
        simultaneousExecutions: this.activeExecutions,
      });
    }
  }

  private logTelemetry(event: string, data: Record<string, unknown>) {
    this.logger.log(JSON.stringify({ event, ...data }));
  }

  private async incrementMetrics(tx: Prisma.TransactionClient, event: AnalyticsEvent) {
    const day = this.utcDay(event.occurredAt);
    const hour = this.utcHour(event.occurredAt);
    await this.upsertDaily(tx, event.organizationId, day, this.dailyIncrements(event.eventType));
    await this.upsertHourly(tx, event.organizationId, hour, this.hourlyIncrements(event.eventType));

    if (event.campaignId) await this.upsertCampaign(tx, event.organizationId, event.campaignId, day, this.campaignIncrements(event.eventType));
    if (event.whatsappAccountId) await this.upsertWhatsapp(tx, event.organizationId, event.whatsappAccountId, day, this.whatsappIncrements(event.eventType));
    if (event.brokerUserId) await this.upsertBroker(tx, event.organizationId, event.brokerUserId, day, this.brokerIncrements(event.eventType));
    if (event.managerUserId) await this.upsertManager(tx, event.organizationId, event.managerUserId, day, this.managerIncrements(event.eventType));
  }

  private async upsertDaily(tx: Prisma.TransactionClient, organizationId: string, bucketStart: Date, data: IncrementData) {
    if (!Object.keys(data).length) return;
    await tx.dailyMetric.upsert({ where: { organizationId_bucketStart: { organizationId, bucketStart } }, create: { organizationId, bucketStart, ...this.toCreate(data) }, update: data });
  }

  private async upsertHourly(tx: Prisma.TransactionClient, organizationId: string, bucketStart: Date, data: IncrementData) {
    if (!Object.keys(data).length) return;
    await tx.hourlyMetric.upsert({ where: { organizationId_bucketStart: { organizationId, bucketStart } }, create: { organizationId, bucketStart, ...this.toCreate(data) }, update: data });
  }

  private async upsertCampaign(tx: Prisma.TransactionClient, organizationId: string, campaignId: string, bucketStart: Date, data: IncrementData) {
    if (!Object.keys(data).length) return;
    await tx.campaignMetric.upsert({ where: { organizationId_campaignId_bucketStart: { organizationId, campaignId, bucketStart } }, create: { organizationId, campaignId, bucketStart, ...this.toCreate(data) }, update: data });
  }

  private async upsertWhatsapp(tx: Prisma.TransactionClient, organizationId: string, whatsappAccountId: string, bucketStart: Date, data: IncrementData) {
    if (!Object.keys(data).length) return;
    await tx.whatsappMetric.upsert({ where: { organizationId_whatsappAccountId_bucketStart: { organizationId, whatsappAccountId, bucketStart } }, create: { organizationId, whatsappAccountId, bucketStart, ...this.toCreate(data) }, update: data });
  }

  private async upsertBroker(tx: Prisma.TransactionClient, organizationId: string, brokerUserId: string, bucketStart: Date, data: IncrementData) {
    if (!Object.keys(data).length) return;
    await tx.brokerMetric.upsert({ where: { organizationId_brokerUserId_bucketStart: { organizationId, brokerUserId, bucketStart } }, create: { organizationId, brokerUserId, bucketStart, ...this.toCreate(data) }, update: data });
  }

  private async upsertManager(tx: Prisma.TransactionClient, organizationId: string, managerUserId: string, bucketStart: Date, data: IncrementData) {
    if (!Object.keys(data).length) return;
    await tx.managerMetric.upsert({ where: { organizationId_managerUserId_bucketStart: { organizationId, managerUserId, bucketStart } }, create: { organizationId, managerUserId, bucketStart, ...this.toCreate(data) }, update: data });
  }

  private dailyIncrements(eventType: string): IncrementData {
    return {
      ...(eventType === 'LEAD_CREATED' ? { leads: { increment: 1 } } : {}),
      ...(eventType === 'CAMPAIGN_STARTED' ? { campaigns: { increment: 1 } } : {}),
      ...(eventType === 'DISTRIBUTION_ASSIGNED' ? { distributions: { increment: 1 } } : {}),
      ...(eventType === 'MESSAGE_SENT' ? { whatsappSent: { increment: 1 } } : {}),
      ...(eventType === 'MESSAGE_READ' ? { whatsappRead: { increment: 1 } } : {}),
      ...(eventType === 'DEAL_WON' ? { conversions: { increment: 1 } } : {}),
    };
  }

  private hourlyIncrements(eventType: string) { return this.dailyIncrements(eventType); }
  private campaignIncrements(eventType: string): IncrementData { return { ...(eventType === 'MESSAGE_SENT' ? { sent: { increment: 1 } } : {}), ...(eventType === 'MESSAGE_DELIVERED' ? { delivered: { increment: 1 } } : {}), ...(eventType === 'MESSAGE_READ' ? { opened: { increment: 1 } } : {}), ...(eventType === 'MESSAGE_FAILED' ? { failed: { increment: 1 } } : {}), ...(eventType === 'DEAL_WON' ? { conversions: { increment: 1 } } : {}) }; }
  private whatsappIncrements(eventType: string): IncrementData { return { ...(eventType === 'MESSAGE_SENT' ? { sent: { increment: 1 } } : {}), ...(eventType === 'MESSAGE_DELIVERED' ? { delivered: { increment: 1 } } : {}), ...(eventType === 'MESSAGE_READ' ? { read: { increment: 1 } } : {}), ...(eventType === 'MESSAGE_FAILED' ? { failed: { increment: 1 } } : {}), ...(eventType === 'CONVERSATION_STARTED' ? { conversations: { increment: 1 } } : {}) }; }
  private brokerIncrements(eventType: string): IncrementData { return { ...(eventType === 'DISTRIBUTION_ASSIGNED' ? { assignedLeads: { increment: 1 } } : {}), ...(eventType === 'DEAL_WON' ? { wonDeals: { increment: 1 } } : {}), ...(eventType === 'DEAL_LOST' ? { lostDeals: { increment: 1 } } : {}), ...(eventType === 'LEAD_STAGE_CHANGED' ? { activities: { increment: 1 } } : {}) }; }
  private managerIncrements(eventType: string): IncrementData { return { ...(eventType === 'DISTRIBUTION_ASSIGNED' ? { assignedLeads: { increment: 1 } } : {}), ...(eventType === 'DEAL_WON' ? { wonDeals: { increment: 1 } } : {}), ...(eventType === 'DEAL_LOST' ? { lostDeals: { increment: 1 } } : {}) }; }
  private toCreate(data: IncrementData) { return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value.increment])); }
  private utcDay(date: Date) { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())); }
  private utcHour(date: Date) { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours())); }
}
