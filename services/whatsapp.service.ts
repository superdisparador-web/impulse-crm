import { api } from './api';
import { ManualWhatsappAccountFormData, PaginatedWhatsappAccounts, SyncWhatsappTemplatesData, WhatsappAccount, WhatsappAccountFormData, WhatsappListParams, WhatsappTemplate } from '@/types/whatsapp';

function toQueryString(params: WhatsappListParams = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') searchParams.set(key, String(value)); });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

class WhatsappService {
  /** Backend creates and stores OAuth state; only the one-time Meta URL reaches the browser. */
  startEmbeddedSignup() { return api.post<{ authorizationUrl: string; expiresAt: string }>('/whatsapp/embedded-signup/session', { returnUrl: `${window.location.origin}/whatsapp` }); }
  getAccounts(params: WhatsappListParams = {}) { return api.get<PaginatedWhatsappAccounts>(`/whatsapp/accounts${toQueryString(params)}`); }
  createAccount(data: WhatsappAccountFormData) { const { credential, ...rest } = data; return api.post<WhatsappAccount>('/whatsapp/accounts', { ...rest, accessToken: credential }); }
  createManualAccount(data: ManualWhatsappAccountFormData) { return api.post<WhatsappAccount>('/whatsapp/admin/accounts/manual', data); }
  updateAccount(id: string, data: Pick<WhatsappAccountFormData, 'name' | 'phoneNumber' | 'apiVersion'>) { return api<WhatsappAccount>(`/whatsapp/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  updateAccessToken(id: string, accessToken: string) { return api<WhatsappAccount>(`/whatsapp/admin/accounts/${id}/access-token`, { method: 'PATCH', body: JSON.stringify({ accessToken }) }); }
  updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE') { return api<WhatsappAccount>(`/whatsapp/accounts/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
  setDefault(id: string) { return api<WhatsappAccount>(`/whatsapp/accounts/${id}/default`, { method: 'PATCH' }); }
  testAccount(id: string) { return api.post<WhatsappAccount>(`/whatsapp/accounts/${id}/test-connection`, {}); }
  syncAccount(id: string) { return api.post<WhatsappAccount>(`/whatsapp/accounts/${id}/sync`, {}); }
  async deleteAccount(id: string) { await api.delete<{ success: boolean }>(`/whatsapp/accounts/${id}`); }
  restoreAccount(id: string) { return api<WhatsappAccount>(`/whatsapp/accounts/${id}/restore`, { method: 'PATCH' }); }
  getTemplates(params: WhatsappListParams = {}) { return api.get<WhatsappTemplate[]>(`/whatsapp/templates${toQueryString(params)}`); }
  syncTemplates(data: SyncWhatsappTemplatesData) { return api.post<{ success: boolean; count: number }>('/whatsapp/templates/sync', data); }
}

export const whatsappService = new WhatsappService();
