import { api } from './api';
import { Lead, LeadActivity, LeadActivityFormData, LeadFormData, LeadListParams, LeadListResponse, LeadStatus, LeadTemperature } from '@/types/lead';

function toQueryString(params: object) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') searchParams.set(key, String(value)); });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

class LeadService {
  getAll(params: LeadListParams = {}) { return api.get<LeadListResponse>(`/leads${toQueryString(params)}`); }
  getById(id: string) { return api.get<Lead>(`/leads/${id}`); }
  getTimeline(id: string) { return api.get<{ leadId: string; items: Lead['events']; note: string }>(`/leads/${id}/timeline`); }
  create(data: LeadFormData) { return api.post<Lead>('/leads', data); }
  update(id: string, data: Partial<LeadFormData>) { return api<Lead>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  assign(id: string, assignedUserId: string | null) { return api<Lead>(`/leads/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ assignedUserId }) }); }
  updateStatus(id: string, status: LeadStatus) { return api<Lead>(`/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
  updateTemperature(id: string, temperature: LeadTemperature) { return api<Lead>(`/leads/${id}/temperature`, { method: 'PATCH', body: JSON.stringify({ temperature }) }); }
  getActivities(id: string) { return api.get<{ items: LeadActivity[] }>(`/leads/${id}/activities`); }
  createActivity(id: string, data: LeadActivityFormData) { return api.post<LeadActivity>(`/leads/${id}/activities`, data); }
  updateActivity(id: string, activityId: string, data: Partial<LeadActivityFormData>) { return api<LeadActivity>(`/leads/${id}/activities/${activityId}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  async delete(id: string) { await api.delete<void>(`/leads/${id}`); }
}
export const leadService = new LeadService();
