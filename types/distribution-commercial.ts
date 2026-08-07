import { User } from "./user";
export type LeadAttendanceStatus =
  | "NEW"
  | "VIEWED"
  | "CONTACT_STARTED"
  | "NO_RESPONSE"
  | "INTERESTED"
  | "SCHEDULED"
  | "VISIT_COMPLETED"
  | "DOCUMENTATION"
  | "PROPOSAL"
  | "SALE"
  | "LOST"
  | "INVALID";
export type AgentAvailabilityStatus =
  "AVAILABLE" | "PAUSED" | "OFF_DUTY" | "INACTIVE";
export interface ReceivedLead {
  id: string;
  attendanceStatus: LeadAttendanceStatus;
  distributedAt?: string | null;
  slaDueAt?: string | null;
  firstUpdatedAt?: string | null;
  nextFollowUpAt?: string | null;
  recipientPhoneE164: string;
  lead?: {
    id: string;
    name?: string | null;
    phone?: string | null;
    metadata?: Record<string, unknown> | null;
    source: string;
  } | null;
  campaign?: { id: string; name: string } | null;
  assignedUser?: Pick<User, "id" | "name"> | null;
  managerUser?: Pick<User, "id" | "name"> | null;
  sla: {
    status:
      "MET" | "BREACHED" | "UNCONFIGURED" | "OVERDUE" | "DUE_SOON" | "ON_TIME";
    dueAt?: string | null;
    remainingSeconds?: number;
  };
  followUps?: CommercialFollowUp[];
}
export interface CommercialFollowUp {
  id: string;
  contactAttempted: "YES" | "NO" | "NOT_TRIED";
  customerResponded: "YES" | "NO" | "WAITING";
  status: LeadAttendanceStatus;
  notes?: string | null;
  nextFollowUpAt?: string | null;
  createdAt: string;
}
export interface ReceivedLeadFilters {
  page?: number;
  limit?: number;
  search?: string;
  campaignId?: string;
  development?: string;
  region?: string;
  neighborhood?: string;
  brokerId?: string;
  managerId?: string;
  status?: LeadAttendanceStatus | "";
  pendingOnly?: boolean;
  overdueOnly?: boolean;
  from?: string;
  to?: string;
}
export interface DistributionMetrics {
  clicksTotal: number;
  clicksUnique: number;
  leadsDistributed: number;
  leadsWithoutDestination: number;
  overdue: number;
  byStatus: Record<string, number>;
}
