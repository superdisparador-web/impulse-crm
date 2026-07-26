import { AnalyticsEventSource } from '@prisma/client';

export const ANALYTICS_DOMAIN_EVENT = 'analytics.domain-event';

export const ANALYTICS_EVENT_TYPES = [
  'LEAD_CREATED',
  'LEAD_ASSIGNED',
  'LEAD_STAGE_CHANGED',
  'CAMPAIGN_STARTED',
  'CAMPAIGN_COMPLETED',
  'MESSAGE_SENT',
  'MESSAGE_DELIVERED',
  'MESSAGE_READ',
  'MESSAGE_CLICKED',
  'MESSAGE_FAILED',
  'FIRST_SERVICE',
  'VISIT_COMPLETED',
  'DOCUMENTATION_STARTED',
  'CAMPAIGN_PAUSED',
  'CAMPAIGN_RESUMED',
  'CAMPAIGN_CANCELED',
  'MESSAGE_RETRY',
  'WEBHOOK_RECEIVED',
  'SCHEDULER_EXECUTED',
  'RECONCILIATION_EXECUTED',
  'CONVERSATION_STARTED',
  'DISTRIBUTION_ASSIGNED',
  'DEAL_WON',
  'DEAL_LOST',
] as const;

export type AnalyticsDomainEventType = typeof ANALYTICS_EVENT_TYPES[number];

export interface AnalyticsDomainEvent {
  organizationId: string;
  source: AnalyticsEventSource;
  eventType: AnalyticsDomainEventType;
  occurredAt: Date;
  idempotencyKey: string;
  leadId?: string | null;
  campaignId?: string | null;
  brokerUserId?: string | null;
  managerUserId?: string | null;
  whatsappAccountId?: string | null;
  distributionId?: string | null;
  dealId?: string | null;
  metadata?: Record<string, unknown>;
}
