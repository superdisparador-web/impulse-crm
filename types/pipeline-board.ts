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
}

export interface PipelineCard {
  id: string;
  position: number;
  enteredStageAt?: string | null;
  lead: PipelineLeadSummary;
}

export interface PipelineStage {
  id: string;
  name: string;
  position: number;
  color?: string | null;
  cards: PipelineCard[];
}

export interface PipelineBoard {
  id: string;
  name: string;
  stages: PipelineStage[];
}

export interface PipelineSummary {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface PipelineMovePayload {
  stageId: string;
  position: number;
}
