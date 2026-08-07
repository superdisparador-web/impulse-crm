import { api } from "./api";
import {
  AnalyticsEventsPage,
  BrokerMetric,
  CampaignFunnel,
  ExecutiveAnalytics,
  ManagerMetric,
  TemplateAnalytics,
} from "@/types/analytics";

function query(params: Record<string, string | number | undefined> = {}) {
  const value = new URLSearchParams(
    Object.entries(params)
      .filter(
        (entry): entry is [string, string | number] => entry[1] !== undefined,
      )
      .map(([key, item]) => [key, String(item)]),
  ).toString();
  return value ? `?${value}` : "";
}

export const analyticsService = {
  executive(params?: { from?: string; to?: string }) {
    const search = new URLSearchParams(
      params as Record<string, string>,
    ).toString();
    return api.get<ExecutiveAnalytics>(
      `/analytics/executive${search ? `?${search}` : ""}`,
    );
  },
  campaignFunnel(id: string) {
    return api.get<CampaignFunnel>(`/analytics/campaigns/${id}/funnel`);
  },
  brokers(
    params: {
      userId?: string;
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    return api.get<BrokerMetric[]>(`/analytics/brokers${query(params)}`);
  },
  managers(
    params: {
      userId?: string;
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    return api.get<ManagerMetric[]>(`/analytics/managers${query(params)}`);
  },
  templates(params: { from?: string; to?: string } = {}) {
    return api.get<TemplateAnalytics[]>(`/analytics/templates${query(params)}`);
  },
  events(
    params: {
      campaignId?: string;
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    return api.get<AnalyticsEventsPage>(`/analytics/events${query(params)}`);
  },
};
