import { api } from "@/services/api";
import { PipelineBoard, PipelineFilters, PipelineMovePayload, PipelineSummary } from "@/types/pipeline-board";

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
