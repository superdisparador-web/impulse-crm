import { api } from './api';
import { AddRecipientsPayload, Campaign, CampaignFilters, CampaignListResponse, CreateCampaignPayload, UpdateCampaignPayload } from '@/types/campaign';
function qs(params: CampaignFilters = {}) { const s = new URLSearchParams(); Object.entries(params).forEach(([k,v]) => { if (v !== undefined && v !== '') s.set(k, String(v)); }); const q=s.toString(); return q ? `?${q}` : ''; }
class CampaignsService {
  getCampaigns(params: CampaignFilters = {}) { return api.get<CampaignListResponse>(`/campaigns${qs(params)}`); }
  getCampaignById(id:string) { return api.get<Campaign>(`/campaigns/${id}`); }
  createCampaign(data:CreateCampaignPayload) { return api.post<Campaign>('/campaigns', data); }
  updateCampaign(id:string, data:UpdateCampaignPayload) { return api<Campaign>(`/campaigns/${id}`, { method:'PATCH', body: JSON.stringify(data) }); }
  deleteCampaign(id:string) { return api.delete<{success:boolean}>(`/campaigns/${id}`); }
  addRecipients(id:string, data:AddRecipientsPayload) { return api.post<{added:number; duplicated:number; ignoredWithoutPhone:number; totalContacts:number}>(`/campaigns/${id}/recipients`, data); }
  removeRecipient(id:string, recipientId:string) { return api.delete<{success:boolean}>(`/campaigns/${id}/recipients/${recipientId}`); }
  scheduleCampaign(id:string, scheduledAt:string) { return api.post<Campaign>(`/campaigns/${id}/schedule`, { scheduledAt }); }
  cancelCampaign(id:string) { return api.post<Campaign>(`/campaigns/${id}/cancel`, {}); }
  duplicateCampaign(id:string) { return api.post<Campaign>(`/campaigns/${id}/duplicate`, {}); }
}
export const campaignsService = new CampaignsService();
