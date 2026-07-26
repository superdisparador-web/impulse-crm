import { api } from './api';
import { Lead, LeadActivity, LeadActivityFormData, LeadFormData, LeadListParams, LeadListResponse, LeadStatus, LeadTemperature } from '@/types/lead';
import { CommercialActivityInput, LeadCommercialDetail, TimelineFilters, TimelinePage } from '@/types/lead-timeline';

function toQueryString(params: object) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') searchParams.set(key, String(value)); });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

class LeadService {
  getAll(params: LeadListParams = {}) { return api.get<LeadListResponse>(`/leads${toQueryString(params)}`); }
  getById(id: string) { return api.get<Lead>(`/leads/${id}`); }
  getTimeline(id: string, filters: TimelineFilters = {}) { return api.get<TimelinePage>(`/leads/${id}/timeline${toQueryString(filters)}`); }
  getCommercialSummary(id:string){return api.get<LeadCommercialDetail>(`/leads/${id}/commercial-summary`);}
  create(data: LeadFormData) { return api.post<Lead>('/leads', data); }
  update(id: string, data: Partial<LeadFormData>) { return api<Lead>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  assign(id: string, assignedUserId: string | null) { return api<Lead>(`/leads/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assignedUserId }) }); }
  updateStatus(id: string, status: LeadStatus) { return api<Lead>(`/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
  updateTemperature(id: string, temperature: LeadTemperature) { return api<Lead>(`/leads/${id}/temperature`, { method: 'PATCH', body: JSON.stringify({ temperature }) }); }
  getActivities(id: string) { return api.get<{ items: LeadActivity[] }>(`/leads/${id}/activities`); }
  createActivity(id: string, data: LeadActivityFormData) { return api.post<LeadActivity>(`/leads/${id}/activities`, data); }
  createCommercialActivity(id:string,data:CommercialActivityInput){return api.post<LeadActivity>(`/leads/${id}/activities`,data);}
  updateActivity(id: string, activityId: string, data: Partial<LeadActivityFormData>) { return api<LeadActivity>(`/leads/${id}/activities/${activityId}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  archive(id: string) { return api< { success: true } >(`/leads/${id}/archive`, { method: 'PATCH' }); }
}
export const leadService = new LeadService();
