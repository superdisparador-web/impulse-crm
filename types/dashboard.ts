import { CampaignStatus } from './campaign';
import { LeadSource, LeadStatus } from './lead';
import { WhatsappAccountStatus } from './whatsapp';

export interface DashboardSummary {
  totalLeads: number;
  leadsToday: number;
  leadsThisWeek: number;
  totalCampaigns: number;
  draftCampaigns: number;
  scheduledCampaigns: number;
  completedCampaigns: number;
  connectedWhatsappAccounts: number;
  disconnectedWhatsappAccounts: number;
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  totalClicked: number;
}

export interface DashboardLeadPoint { date: string; total: number; }
export interface DashboardCampaignStatus { status: CampaignStatus; total: number; }
export interface DashboardPerformance { sent: number; delivered: number; read: number; failed: number; clicked: number; }
export interface DashboardRecentLead { id: string; name: string; phone: string; email?: string | null; status: LeadStatus; source: LeadSource; createdAt: string; assignedUser?: { id: string; name: string; email: string } | null; }
export interface DashboardRecentCampaign { id: string; name: string; status: CampaignStatus; scheduledAt?: string | null; totalContacts: number; totalSent: number; totalDelivered: number; totalRead: number; totalFailed: number; totalClicked: number; createdAt: string; }
export interface DashboardWhatsappAccount { id: string; name: string; phoneNumber: string; status: WhatsappAccountStatus; connectedAt?: string | null; lastSyncAt?: string | null; }
export interface DashboardTopUser { id: string; name: string; email: string; totalLeads: number; }

export interface DashboardResponse {
  summary: DashboardSummary;
  leadsByDay: DashboardLeadPoint[];
  campaignsByStatus: DashboardCampaignStatus[];
  campaignPerformance: DashboardPerformance;
  recentLeads: DashboardRecentLead[];
  recentCampaigns: DashboardRecentCampaign[];
  whatsappAccounts: DashboardWhatsappAccount[];
  scheduledCampaigns: DashboardRecentCampaign[];
  topUsers: DashboardTopUser[];
}
