import { api } from './api';
import { Pipeline, PipelineListParams, PipelineStage, PipelineStageListParams } from '@/types/pipeline';

function toQueryString(params: object) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') searchParams.set(key, String(value)); });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

class PipelineService {
  getAll(params: PipelineListParams = {}) { return api.get<Pipeline[]>(`/pipelines${toQueryString(params)}`); }
  create(data: { name: string; active?: boolean }) { return api.post<Pipeline>('/pipelines', data); }
  update(id: string, data: Partial<{ name: string; active: boolean }>) { return api<Pipeline>(`/pipelines/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  async delete(id: string) { await api.delete<void>(`/pipelines/${id}`); }
  getStages(params: PipelineStageListParams = {}) { return api.get<PipelineStage[]>(`/pipeline-stages${toQueryString(params)}`); }
  createStage(data: { name: string; pipelineId: string; order?: number; color?: string; active?: boolean }) { return api.post<PipelineStage>('/pipeline-stages', data); }
  updateStage(id: string, data: Partial<{ name: string; pipelineId: string; order: number; color: string; active: boolean }>) { return api<PipelineStage>(`/pipeline-stages/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  async deleteStage(id: string) { await api.delete<void>(`/pipeline-stages/${id}`); }
}
export const pipelineService = new PipelineService();
