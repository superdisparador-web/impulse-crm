export interface ExecutiveAnalytics {
  campaigns: { active: number; completed: number; paused: number; canceled: number };
  messages: { contacts: number; sent: number; delivered: number; read: number; clicked: number; failed: number };
  rates: { ctr: number; readRate: number; deliveryRate: number; conversionRate: number };
  conversions: number;
  averageCampaignTimeMs: number;
  ranking: Array<{ id: string; name: string; sent: number; ctr: number; readRate: number; deliveryRate: number; conversionRate: number }>;
  temporal: Array<{ bucketStart: string; whatsappSent: number; whatsappRead: number; conversions: number }>;
  recentEvents: Array<{ id: string; eventType: string; source: string; occurredAt: string }>;
  operationalAlerts: Array<{ id: string; status: string; lastError?: string | null; updatedAt: string }>;
}

export interface CampaignFunnelStage { key: string; label: string; value: number; stepRate: number; cumulativeRate: number; abandonment: number }
export interface CampaignFunnel { campaign: { id: string; name: string }; stages: CampaignFunnelStage[]; bottleneck: CampaignFunnelStage | null; averageDeliveryTimeMs: number; averageReadTimeMs: number }
export interface BrokerMetric { id: string; brokerUserId: string; bucketStart: string; assignedLeads: number; contactedLeads: number; wonDeals: number; lostDeals: number; activities: number }
export interface ManagerMetric { id: string; managerUserId: string; bucketStart: string; managedLeads: number; assignedLeads: number; activeBrokers: number; wonDeals: number; lostDeals: number }
export interface TemplateAnalytics { id: string; name: string; campaigns: number; used: number; sent: number; delivered: number; read: number; clicked: number; conversions: number; lastUsedAt: string; ctr: number; deliveryRate: number; readRate: number; conversionRate: number }
export interface AnalyticsEvent { id: string; eventType: string; source: string; campaignId?: string | null; leadId?: string | null; brokerUserId?: string | null; occurredAt: string; metadata?: Record<string, unknown> | null }
export interface AnalyticsEventsPage { items: AnalyticsEvent[]; pagination: { page: number; limit: number; total: number; pages: number } }
export interface LeadTimelineEvent { id: string; source: "LEADS" | "CAMPAIGNS" | "WHATSAPP" | "PIPELINE"; type: string; occurredAt: string; campaign?: { id: string; name: string }; event?: { description?: string; eventType?: string }; message?: { direction: string; status: string } }
