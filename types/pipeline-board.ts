export interface AssignedUserSummary {
  id: string;
  name: string;
}

export interface PipelineLeadSummary {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
  temperature?: string | null;
  assignedUser?: AssignedUserSummary | null;
  managerUser?: AssignedUserSummary | null;
  source?: string | null;
  development?: string | null;
  region?: string | null;
  neighborhood?: string | null;
  updatedAt?: string | null;
  sla?: { dueAt: string; status: "OVERDUE" | "ON_TIME" | "ATTENDED" } | null;
}

export interface PipelineCard {
  id: string;
  position: number;
  enteredStageAt?: string | null;
  stageId?: string | null;
  lead: PipelineLeadSummary;
}

export interface PipelineStage {
  id: string;
  name: string;
  position: number;
  color?: string | null;
  cards: PipelineCard[];
  total?: number;
}

export interface PipelineMetrics { total: number; byStage: Record<string, number>; conversionRate: number; averageStageHours: number; overdueSla: number; }

export interface PipelineBoard {
  id: string;
  name: string;
  stages: PipelineStage[];
  metrics?: PipelineMetrics;
  pagination?: { limit: number; returned: number; total: number };
}

export interface PipelineFilters { search?: string; brokerId?: string; managerId?: string; development?: string; region?: string; neighborhood?: string; status?: string; temperature?: string; source?: string; from?: string; to?: string; sla?: "ALL" | "OVERDUE" | "ON_TIME"; limit?: number; }

export interface PipelineSummary {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface PipelineMovePayload {
  stageId: string;
  position: number;
}
