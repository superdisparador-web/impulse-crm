import { api } from "@/services/api";
import { PipelineBoard, PipelineFilters, PipelineMovePayload, PipelineStage, PipelineSummary } from "@/types/pipeline-board";

export function listPipelines(): Promise<PipelineSummary[]> {
  return api.get<PipelineSummary[]>("/pipeline");
}

export function getPipelineBoard(pipelineId: string, filters: PipelineFilters = {}): Promise<PipelineBoard> {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined && value !== "").map(([key, value]) => [key, String(value)]));
  return api.get<PipelineBoard>(`/pipeline/${pipelineId}/board${query.size ? `?${query}` : ""}`);
}

export function movePipelineCard(cardId: string, stageId: string, position: number): Promise<PipelineBoard | { ok: boolean }> {
  const payload: PipelineMovePayload = { stageId, position };
  return api<PipelineBoard | { ok: boolean }>(`/pipeline/cards/${cardId}/move`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function createPipelineStage(pipelineId: string, data: { name: string; color?: string }) {
  return api.post<PipelineStage>(`/pipeline/${pipelineId}/stages`, data);
}

export function updatePipelineStage(pipelineId: string, stageId: string, data: { name: string; color?: string }) {
  return api<PipelineStage>(`/pipeline/${pipelineId}/stages/${stageId}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deletePipelineStage(pipelineId: string, stageId: string) {
  return api.delete<{ success: boolean }>(`/pipeline/${pipelineId}/stages/${stageId}`);
}

export function reorderPipelineStages(pipelineId: string, stages: PipelineStage[]) {
  return api<PipelineStage[]>(`/pipeline/${pipelineId}/stages/reorder`, { method: "PATCH", body: JSON.stringify({ stages: stages.map((stage, index) => ({ id: stage.id, position: index + 1 })) }) });
}
