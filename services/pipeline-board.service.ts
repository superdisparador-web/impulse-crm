import { api } from "@/services/api";
import { PipelineBoard, PipelineMovePayload, PipelineSummary } from "@/types/pipeline-board";

export function listPipelines(): Promise<PipelineSummary[]> {
  return api.get<PipelineSummary[]>("/pipeline");
}

export function getPipelineBoard(pipelineId: string): Promise<PipelineBoard> {
  return api.get<PipelineBoard>(`/pipeline/${pipelineId}/board`);
}

export function movePipelineCard(cardId: string, stageId: string, position: number): Promise<PipelineBoard | { ok: boolean }> {
  const payload: PipelineMovePayload = { stageId, position };
  return api<PipelineBoard | { ok: boolean }>(`/pipeline/cards/${cardId}/move`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
