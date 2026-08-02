import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AnalyticsEvent, Prisma } from '@prisma/client';
import { AnalyticsRepository } from '../repositories/analytics.repository';

type IncrementData = Record<string, { increment: number }>;

@Injectable()
export class AnalyticsRollupJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AnalyticsRollupJob.name);
  private timer?: NodeJS.Timeout;
  private running = false;
  private consecutiveFailures = 0;
  private readonly intervalMs = Number(process.env.ANALYTICS_ROLLUP_INTERVAL_MS || 60_000);
  private readonly maxBackoffMs = Number(process.env.ANALYTICS_ROLLUP_MAX_BACKOFF_MS || 300_000);

  constructor(private readonly repository: AnalyticsRepository) {}

  onModuleInit() {
    if (this.timer) return;
    this.logger.log('Analytics rollup scheduler iniciado');
    this.schedule(this.intervalMs);
  }

  onModuleDestroy() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
  }

  async runOnce(limit = 100) {
    if (this.running) {
      this.logger.warn('Analytics rollup ignorado: execução anterior ainda ativa');
      return { processed: 0, skipped: true };
    }
    this.running = true;
    const startedAt = Date.now();
    let processed = 0;
    try {
      this.logger.log('Analytics rollup iniciado');
      for (let index = 0; index < limit; index += 1) {
        const didProcess = await this.repository.processEvent((tx, event) => this.incrementMetrics(tx, event));
        if (!didProcess) break;
        processed += 1;
      }
      this.consecutiveFailures = 0;
      this.logger.log(`Analytics rollup concluído: ${processed} evento(s), ${Date.now() - startedAt}ms`);
      return { processed, skipped: false };
    } catch (error) {
      this.consecutiveFailures += 1;
      const code = (error as { code?: string }).code ?? 'UNKNOWN';
      this.logger.error(`Analytics rollup falhou (Prisma ${code}); próxima tentativa em ${this.nextDelayMs()}ms`);
      throw error;
    } finally {
      this.running = false;
    }
  }

  nextDelayMs() {
    if (!this.consecutiveFailures) return this.intervalMs;
    return Math.min(this.intervalMs * 2 ** (this.consecutiveFailures - 1), this.maxBackoffMs);
  }

  private schedule(delayMs: number) {
    this.timer = setTimeout(async () => {
      try { await this.runOnce(); } catch { /* runOnce already logged the controlled retry */ }
      if (this.timer) this.schedule(this.nextDelayMs());
    }, delayMs);
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
  private campaignIncrements(eventType: string): IncrementData { return { ...(eventType === 'MESSAGE_SENT' ? { sent: { increment: 1 } } : {}), ...(eventType === 'MESSAGE_DELIVERED' ? { delivered: { increment: 1 } } : {}), ...(eventType === 'MESSAGE_READ' ? { opened: { increment: 1 } } : {}), ...(eventType === 'MESSAGE_CLICKED' ? { clicked: { increment: 1 } } : {}), ...(eventType === 'MESSAGE_FAILED' ? { failed: { increment: 1 } } : {}), ...(eventType === 'DEAL_WON' ? { conversions: { increment: 1 } } : {}) }; }
  private whatsappIncrements(eventType: string): IncrementData { return { ...(eventType === 'MESSAGE_SENT' ? { sent: { increment: 1 } } : {}), ...(eventType === 'MESSAGE_DELIVERED' ? { delivered: { increment: 1 } } : {}), ...(eventType === 'MESSAGE_READ' ? { read: { increment: 1 } } : {}), ...(eventType === 'MESSAGE_FAILED' ? { failed: { increment: 1 } } : {}), ...(eventType === 'CONVERSATION_STARTED' ? { conversations: { increment: 1 } } : {}) }; }
  private brokerIncrements(eventType: string): IncrementData { return { ...(eventType === 'DISTRIBUTION_ASSIGNED' ? { assignedLeads: { increment: 1 } } : {}), ...(eventType === 'DEAL_WON' ? { wonDeals: { increment: 1 } } : {}), ...(eventType === 'DEAL_LOST' ? { lostDeals: { increment: 1 } } : {}), ...(eventType === 'LEAD_STAGE_CHANGED' ? { activities: { increment: 1 } } : {}) }; }
  private managerIncrements(eventType: string): IncrementData { return { ...(eventType === 'DISTRIBUTION_ASSIGNED' ? { assignedLeads: { increment: 1 } } : {}), ...(eventType === 'DEAL_WON' ? { wonDeals: { increment: 1 } } : {}), ...(eventType === 'DEAL_LOST' ? { lostDeals: { increment: 1 } } : {}) }; }
  private toCreate(data: IncrementData) { return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value.increment])); }
  private utcDay(date: Date) { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())); }
  private utcHour(date: Date) { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours())); }
}
