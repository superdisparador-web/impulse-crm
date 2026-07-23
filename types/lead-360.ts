import { Lead, LeadActivity, LeadEvent } from "./lead";
import { PipelineBoard, PipelineCard } from "./pipeline-board";

export interface LeadNote {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead360Data {
  lead: Lead;
  card: PipelineCard;
  board: PipelineBoard;
  events: LeadEvent[];
  activities: LeadActivity[];
  notes: LeadNote[];
}

export interface Lead360TimelineItem {
  id: string;
  title: string;
  description?: string;
  occurredAt: string;
  kind: "lead" | "pipeline" | "note" | "activity";
}
