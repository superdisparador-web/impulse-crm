import { api } from "./api";
import {
  AgentAvailabilityStatus,
  CommercialFollowUp,
  DistributionMetrics,
  LeadAttendanceStatus,
  ReceivedLead,
  ReceivedLeadFilters,
} from "@/types/distribution-commercial";
import { User } from "@/types/user";
const qs = (params: object) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  return search.toString() ? `?${search}` : "";
};
class DistributionCommercialService {
  list(filters: ReceivedLeadFilters = {}) {
    return api.get<{
      items: ReceivedLead[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>(`/distributed-leads${qs(filters)}`);
  }
  detail(id: string) {
    return api.get<ReceivedLead>(`/distributed-leads/${id}`);
  }
  metrics() {
    return api.get<DistributionMetrics>("/distributed-leads/metrics");
  }
  updateStatus(id: string, status: LeadAttendanceStatus, notes?: string) {
    return api<ReceivedLead>(`/distributed-leads/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
    });
  }
  followUp(
    id: string,
    data: {
      contactAttempted: string;
      customerResponded: string;
      status: LeadAttendanceStatus;
      notes?: string;
      nextFollowUpAt?: string;
    },
  ) {
    return api.post<CommercialFollowUp>(
      `/distributed-leads/${id}/follow-up`,
      data,
    );
  }
  reassign(id: string, brokerUserId: string, reason: string) {
    return api.post<ReceivedLead>(`/distributed-leads/${id}/reassign`, {
      brokerUserId,
      reason,
    });
  }
  availability() {
    return api.get<
      (User & {
        agentAvailability?: {
          status: AgentAvailabilityStatus;
          changedAt: string;
          reason?: string | null;
        } | null;
      })[]
    >("/agent-availability");
  }
  setAvailability(
    userId: string,
    status: AgentAvailabilityStatus,
    reason?: string,
  ) {
    return api(`/agent-availability/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    });
  }
}
export const distributionCommercialService =
  new DistributionCommercialService();
