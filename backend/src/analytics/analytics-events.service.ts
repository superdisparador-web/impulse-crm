import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsDomainEvent } from './analytics-domain-event';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class AnalyticsEventsService {
  private readonly logger = new Logger(AnalyticsEventsService.name);
  constructor(private readonly analytics: AnalyticsService) {}

  async emit(event: AnalyticsDomainEvent): Promise<void> {
    try {
      await this.analytics.recordDomainEvent(event);
    } catch (error) {
      this.logger.error('Failed to persist analytics domain event', { eventType: event.eventType, organizationId: event.organizationId, idempotencyKey: event.idempotencyKey, error });
    }
  }
}
