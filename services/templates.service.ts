import { api } from './api';
import { PaginatedWhatsappTemplates, WhatsappTemplate, WhatsappTemplateFilters, WhatsappTemplateFormData } from '@/types/templates';
function qs(params: WhatsappTemplateFilters = {}) { const s = new URLSearchParams(); Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') s.set(k, String(v)); }); const q = s.toString(); return q ? `?${q}` : ''; }
class TemplatesService {
  getTemplates(params: WhatsappTemplateFilters = {}) { return api.get<PaginatedWhatsappTemplates>(`/whatsapp/templates${qs(params)}`); }
  getTemplate(id: string) { return api.get<WhatsappTemplate>(`/whatsapp/templates/${id}`); }
  createTemplate(data: WhatsappTemplateFormData) { return api.post<WhatsappTemplate>('/whatsapp/templates', data); }
  updateTemplate(id: string, data: Partial<WhatsappTemplateFormData>) { return api<WhatsappTemplate>(`/whatsapp/templates/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
  archiveTemplate(id: string) { return api<WhatsappTemplate>(`/whatsapp/templates/${id}/archive`, { method: 'PATCH' }); }
  restoreTemplate(id: string) { return api<WhatsappTemplate>(`/whatsapp/templates/${id}/restore`, { method: 'PATCH' }); }
  deleteTemplate(id: string) { return api.delete<{ success: boolean }>(`/whatsapp/templates/${id}`); }
}
export const templatesService = new TemplatesService();
