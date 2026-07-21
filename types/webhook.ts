import { InboundMessage } from './inbound-message';

export type WebhookEventStatus = 'RECEIVED' | 'PROCESSED' | 'FAILED' | 'IGNORED';

export type WebhookEvent = {
  id: string;
  provider: 'META';
  eventType: string;
  status: WebhookEventStatus;
  whatsappAccountId?: string | null;
  phoneNumberId?: string | null;
  metaMessageId?: string | null;
  errorMessage?: string | null;
  signatureValid?: boolean | null;
  processedAt?: string | null;
  createdAt: string;
};

export type WebhookOverview = {
  health: WebhookHealth;
  events: WebhookEvent[];
  errors: WebhookEvent[];
  inboundMessages: InboundMessage[];
  totals: Array<{ eventType: string; total: number }>;
  meta: { page: number; limit: number; totalEvents: number; totalErrors: number; totalInboundMessages: number };
};

export type WebhookHealth = { status: 'ok'; provider: 'meta'; timestamp: string };
