import { api } from './api';
import { SyncWhatsappTemplatesData, WhatsappAccount, WhatsappAccountFormData, WhatsappListParams, WhatsappTemplate } from '@/types/whatsapp';

function toQueryString(params: WhatsappListParams = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value) searchParams.set(key, String(value)); });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

class WhatsappService {
  getAccounts(params: WhatsappListParams = {}) { return api.get<WhatsappAccount[]>(`/whatsapp/accounts${toQueryString(params)}`); }
  createAccount(data: WhatsappAccountFormData) { return api.post<WhatsappAccount>('/whatsapp/accounts', data); }
  updateAccount(id: string, data: Partial<WhatsappAccountFormData>) { return api<WhatsappAccount>(`/whatsapp/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  async deleteAccount(id: string) { await api.delete<void>(`/whatsapp/accounts/${id}`); }
  getTemplates(params: WhatsappListParams = {}) { return api.get<WhatsappTemplate[]>(`/whatsapp/templates${toQueryString(params)}`); }
  syncTemplates(data: SyncWhatsappTemplatesData) { return api.post<{ success: boolean; message: string }>('/whatsapp/templates/sync', data); }
}

export const whatsappService = new WhatsappService();
