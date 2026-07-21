import { api } from './api';
import { Deal, DealListResponse, KanbanResponse, LossReason, Pipeline, Tag } from '@/types/pipeline';
function qs(params: object = {}) { const s = new URLSearchParams(); Object.entries(params).forEach(([k,v]) => { if (v !== undefined && v !== '') s.set(k, String(v)); }); const q=s.toString(); return q ? `?${q}` : ''; }
class PipelineService {
  pipelines(params: object = {}) { return api.get<Pipeline[]>(`/pipeline/pipelines${qs(params)}`); }
  createPipeline(data: Partial<Pipeline>) { return api.post<Pipeline>('/pipeline/pipelines', data); }
  updatePipeline(id:string, data: Partial<Pipeline>) { return api<Pipeline>(`/pipeline/pipelines/${id}`, { method:'PATCH', body: JSON.stringify(data) }); }
  createStage(pipelineId:string, data: object) { return api.post(`/pipeline/pipelines/${pipelineId}/stages`, data); }
  updateStage(id:string, data: object) { return api(`/pipeline/stages/${id}`, { method:'PATCH', body: JSON.stringify(data) }); }
  reorderStages(pipelineId:string, stages: Array<{id:string; position:number; isInitial?:boolean}>) { return api(`/pipeline/stages/reorder/${pipelineId}`, { method:'PATCH', body: JSON.stringify({ stages }) }); }
  tags(params: object = {}) { return api.get<Tag[]>(`/pipeline/tags${qs(params)}`); }
  createTag(data: object) { return api.post<Tag>('/pipeline/tags', data); }
  lossReasons(params: object = {}) { return api.get<LossReason[]>(`/pipeline/loss-reasons${qs(params)}`); }
  createLossReason(data: object) { return api.post<LossReason>('/pipeline/loss-reasons', data); }
  deals(params: object = {}) { return api.get<DealListResponse>(`/pipeline/deals${qs(params)}`); }
  getDeal(id:string) { return api.get<Deal>(`/pipeline/deals/${id}`); }
  createDeal(data: object) { return api.post<Deal>('/pipeline/deals', data); }
  updateDeal(id:string, data: object) { return api<Deal>(`/pipeline/deals/${id}`, { method:'PATCH', body: JSON.stringify(data) }); }
  moveDeal(id:string, toStageId:string) { return api.post<Deal>(`/pipeline/deals/${id}/move`, { toStageId }); }
  won(id:string, amount:number) { return api.post<Deal>(`/pipeline/deals/${id}/won`, { amount }); }
  lost(id:string, lossReasonId:string) { return api.post<Deal>(`/pipeline/deals/${id}/lost`, { lossReasonId }); }
  reopen(id:string, toStageId:string) { return api.post<Deal>(`/pipeline/deals/${id}/reopen`, { toStageId }); }
  addTag(id:string, tagId:string) { return api.post(`/pipeline/deals/${id}/tags`, { tagId }); }
  timeline(id:string) { return api.get(`/pipeline/deals/${id}/timeline`); }
  kanban(pipelineId:string, params: object = {}) { return api.get<KanbanResponse>(`/pipeline/pipelines/${pipelineId}/kanban${qs(params)}`); }
}
export const pipelineService = new PipelineService();
