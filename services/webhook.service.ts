import { api } from './api';
import { WebhookHealth, WebhookOverview } from '@/types/webhook';

type WebhookOverviewParams = { page?: number; limit?: number };

function toQueryString(params: WebhookOverviewParams = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value) searchParams.set(key, String(value)); });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

class WebhookApiService {
  getOverview(params: WebhookOverviewParams = {}) { return api.get<WebhookOverview>(`/webhooks${toQueryString(params)}`); }
  getHealth() { return api.get<WebhookHealth>('/webhooks/health'); }
}

export const webhookService = new WebhookApiService();
