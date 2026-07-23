import { api } from './api';
import { PaginatedWhatsappAccounts, SyncWhatsappTemplatesData, WhatsappAccount, WhatsappAccountFormData, WhatsappListParams, WhatsappTemplate } from '@/types/whatsapp';

function toQueryString(params: WhatsappListParams = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') searchParams.set(key, String(value)); });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

class WhatsappService {
  getAccounts(params: WhatsappListParams = {}) { return api.get<PaginatedWhatsappAccounts>(`/whatsapp/accounts${toQueryString(params)}`); }
  createAccount(data: WhatsappAccountFormData) { const { credential, ...rest } = data; return api.post<WhatsappAccount>('/whatsapp/accounts', { ...rest, accessToken: credential }); }
  updateAccount(id: string, data: Partial<WhatsappAccountFormData>) { const { credential, ...rest } = data; return api<WhatsappAccount>(`/whatsapp/accounts/${id}`, { method: 'PATCH', body: JSON.stringify({ ...rest, ...(credential ? { accessToken: credential } : {}) }) }); }
  updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE') { return api<WhatsappAccount>(`/whatsapp/accounts/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
  setDefault(id: string) { return api<WhatsappAccount>(`/whatsapp/accounts/${id}/default`, { method: 'PATCH' }); }
  testAccount(id: string) { return api.post<WhatsappAccount>(`/whatsapp/accounts/${id}/test`, {}); }
  syncAccount(id: string) { return api.post<WhatsappAccount>(`/whatsapp/accounts/${id}/sync`, {}); }
  async deleteAccount(id: string) { await api.delete<{ success: boolean }>(`/whatsapp/accounts/${id}`); }
  restoreAccount(id: string) { return api<WhatsappAccount>(`/whatsapp/accounts/${id}/restore`, { method: 'PATCH' }); }
  getTemplates(params: WhatsappListParams = {}) { return api.get<WhatsappTemplate[]>(`/whatsapp/templates${toQueryString(params)}`); }
  syncTemplates(data: SyncWhatsappTemplatesData) { return api.post<{ success: boolean; count: number }>('/whatsapp/templates/sync', data); }
}

export const whatsappService = new WhatsappService();
