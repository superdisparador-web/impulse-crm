import { api } from './api';
import { AddRecipientsPayload, Campaign, CampaignEstimateResponse, CampaignFilter, CampaignFilters, CampaignListResponse, CampaignProgress, CreateCampaignPayload, OperationalRecipients, UpdateCampaignPayload } from '@/types/campaign';
function qs(params: object = {}) { const s = new URLSearchParams(); Object.entries(params).forEach(([k,v]) => { if (v !== undefined && v !== '') s.set(k, String(v)); }); const q=s.toString(); return q ? `?${q}` : ''; }
class CampaignsService {
  getCampaigns(params: CampaignFilters = {}) { return api.get<CampaignListResponse>(`/campaigns${qs(params)}`); }
  getCampaignById(id:string) { return api.get<Campaign>(`/campaigns/${id}`); }
  createCampaign(data:CreateCampaignPayload) { return api.post<Campaign>('/campaigns', data); }
  updateCampaign(id:string, data:UpdateCampaignPayload) { return api<Campaign>(`/campaigns/${id}`, { method:'PATCH', body: JSON.stringify(data) }); }
  deleteCampaign(id:string) { return api.delete<{success:boolean}>(`/campaigns/${id}`); }
  restoreCampaign(id:string) { return api<Campaign>(`/campaigns/${id}/restore`, { method:'PATCH' }); }
  archiveCampaign(id:string, archived:boolean) { return api<Campaign>(`/campaigns/${id}/archive`, { method:'PATCH', body: JSON.stringify({ archived }) }); }
  addRecipients(id:string, data:AddRecipientsPayload) { return api.post<{added:number; duplicated:number; ignoredWithoutPhone:number; totalContacts:number}>(`/campaigns/${id}/recipients`, data); }
  removeRecipient(id:string, recipientId:string) { return api.delete<{success:boolean}>(`/campaigns/${id}/recipients/${recipientId}`); }
  scheduleCampaign(id:string, scheduledAt:string) { return api.post<Campaign>(`/campaigns/${id}/schedule`, { scheduledAt }); }
  duplicateCampaign(id:string) { return api.post<Campaign>(`/campaigns/${id}/duplicate`, {}); }
  cancelCampaign(id:string,reason?:string) { return api.post<Campaign>(`/campaigns/${id}/cancel`, {reason}); }
  validateCampaign(id:string){return api.post<{valid:boolean;reasons:{code:string;message:string}[]}>(`/campaigns/${id}/validate`,{});}
  startCampaign(id:string){return api.post<Campaign>(`/campaigns/${id}/start`,{});}
  pauseCampaign(id:string){return api.post<Campaign>(`/campaigns/${id}/pause`,{});}
  resumeCampaign(id:string){return api.post<Campaign>(`/campaigns/${id}/resume`,{});}
  progress(id:string){return api.get<CampaignProgress>(`/campaigns/${id}/progress`);}
  recipients(id:string,params:{status?:string;search?:string;assignedUserId?:string;error?:string;attempt?:number;page?:number;limit?:number}={}){return api.get<OperationalRecipients>(`/campaigns/${id}/recipients${qs(params)}`);}
  report(id:string){return api.get<Record<string,unknown>>(`/campaigns/${id}/report`);}
  async downloadResults(id:string){const blob=await api.blob(`/campaigns/${id}/results.csv`),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='resultados-campanha.csv';a.click();URL.revokeObjectURL(url);}
  estimate(filters:CampaignFilter[]) { return api.post<CampaignEstimateResponse>('/campaigns/estimate', { filters }); }
  saveStep(id:string,currentStep:number){return api<Campaign>(`/campaigns/${id}/step`,{method:'PATCH',body:JSON.stringify({currentStep})});}
  uploadList(id:string,file:File){const body=new FormData();body.append('file',file);return api<CampaignImport>(`/campaigns/${id}/list/upload`,{method:'POST',body});}
  analyzeList(id:string,data:{phoneColumn:string;nameColumn?:string;includedColumns:string[];confirmed:boolean}){return api<CampaignListSummary>(`/campaigns/${id}/list/mapping`,{method:'PATCH',body:JSON.stringify(data)});}
  configureTemplate(id:string,data:{whatsappTemplateId:string;variableMappings:VariableMapping[]}){return api<Campaign>(`/campaigns/${id}/template`,{method:'PATCH',body:JSON.stringify(data)});}
  uploadMedia(id:string,file:File){const body=new FormData();body.append('file',file);return api<Campaign>(`/campaigns/${id}/template/media`,{method:'POST',body});}
  configureDestination(id:string,data:DestinationConfiguration){return api<Campaign>(`/campaigns/${id}/destination`,{method:'PATCH',body:JSON.stringify(data)});}
  recipientSample(id:string,kind:'valid'|'invalid'|'duplicates',page=1){return api<RecipientSample>(`/campaigns/${id}/list/sample/${kind}?page=${page}`);}
  async downloadList(id:string,kind:'invalid'|'duplicates'|'clean'){const blob=await api.blob(`/campaigns/${id}/list/${kind}.csv`),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`campanha-${kind}.csv`;a.click();URL.revokeObjectURL(url);}
  review(id:string,confirmed:boolean){return api<Campaign>(`/campaigns/${id}/review`,{method:'POST',body:JSON.stringify({confirmed})});}
}
export const campaignsService = new CampaignsService();
export type CampaignImport={headers:{id:string;name:string;index:number}[];sample:Record<string,string>[];phoneCandidates:string[];nameCandidates:string[];totalRows:number};
export type CampaignListSummary={status:string;total:number;valid:number;invalid:number;duplicate:number;ddiCorrected:number;withoutName:number;ready:number};
export type VariableMapping={component:'HEADER'|'BODY'|'BUTTON';position:number;sourceType:'COLUMN'|'FIXED'|'LEAD_NAME'|'LEAD_PHONE'|'SYSTEM_FIELD';sourceColumn?:string;fixedValue?:string;buttonIndex?:number};
export type CampaignAgentConfiguration={userId:string;position:number;weight:number;active:boolean};
export type DestinationConfiguration={mode:'FIXED_URL'|'AGENT_FIXED'|'ROUND_ROBIN';fixedUrl?:string;agentId?:string;agents?:CampaignAgentConfiguration[];initialIndex?:number};
export type RecipientSample={items:{id:string;originalRowNumber:number;originalData:Record<string,unknown>;phoneOriginal:string;phone:string;name?:string;status:string;invalidReason?:string}[];meta:{page:number;limit:number;total:number;totalPages:number}};
