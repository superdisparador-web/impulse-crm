import { Injectable } from '@nestjs/common';
import {
  MetaContact,
  MetaSendResult,
  MetaTemplate,
  MetaWhatsappClient,
} from './meta-whatsapp.client';

@Injectable()
export class MetaWhatsappHttpClient extends MetaWhatsappClient {
  private readonly graphVersion = process.env.META_GRAPH_API_VERSION || 'v20.0'; private readonly timeoutMs = Number(process.env.META_WHATSAPP_TIMEOUT_MS || 8000);
  private base() { return `https://graph.facebook.com/${this.graphVersion}`; }
  private async request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> { const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), this.timeoutMs); try { const res = await fetch(`${this.base()}${path}`, { ...init, signal: controller.signal, headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, ...(init.headers || {}) } }); const body = await res.json().catch(() => ({})); if (!res.ok) throw new Error(body?.error?.message || `Meta API error ${res.status}`); return body as T; } finally { clearTimeout(timeout); } }
  async testConnection(input: { accessToken: string; phoneNumberId: string }) { await this.request(`/${input.phoneNumberId}?fields=id,display_phone_number,quality_rating`, input.accessToken); return { ok: true }; }
  async sendText(input: { accessToken: string; phoneNumberId: string; to: string; text: string; replyToExternalMessageId?: string }): Promise<MetaSendResult> { const body: Record<string, unknown> = { messaging_product: 'whatsapp', to: input.to, type: 'text', text: { body: input.text } }; if (input.replyToExternalMessageId) body.context = { message_id: input.replyToExternalMessageId }; const r = await this.request<{ messages?: { id: string }[] }>(`/${input.phoneNumberId}/messages`, input.accessToken, { method: 'POST', body: JSON.stringify(body) }); return { externalMessageId: r.messages?.[0]?.id || '' }; }
  async sendTemplate(input: { accessToken: string; phoneNumberId: string; to: string; name: string; language: string; components?: unknown[] }): Promise<MetaSendResult> { const r = await this.request<{ messages?: { id: string }[] }>(`/${input.phoneNumberId}/messages`, input.accessToken, { method: 'POST', body: JSON.stringify({ messaging_product: 'whatsapp', to: input.to, type: 'template', template: { name: input.name, language: { code: input.language }, components: input.components || [] } }) }); return { externalMessageId: r.messages?.[0]?.id || '' }; }
  async sendContacts(input: { accessToken: string; phoneNumberId: string; to: string; contacts: MetaContact[] }): Promise<MetaSendResult> { const contacts = input.contacts.map((contact) => ({ name: { formatted_name: contact.displayName }, phones: [{ phone: contact.phoneE164.replace('+', ''), type: 'CELL', wa_id: contact.phoneE164.replace('+', '') }] })); const r = await this.request<{ messages?: { id: string }[] }>(`/${input.phoneNumberId}/messages`, input.accessToken, { method: 'POST', body: JSON.stringify({ messaging_product: 'whatsapp', to: input.to, type: 'contacts', contacts }) }); return { externalMessageId: r.messages?.[0]?.id || '' }; }
  async sendMedia(input: { accessToken: string; phoneNumberId: string; to: string; type: string; mediaId: string; caption?: string }): Promise<MetaSendResult> { const r = await this.request<{ messages?: { id: string }[] }>(`/${input.phoneNumberId}/messages`, input.accessToken, { method: 'POST', body: JSON.stringify({ messaging_product: 'whatsapp', to: input.to, type: input.type, [input.type]: { id: input.mediaId, caption: input.caption } }) }); return { externalMessageId: r.messages?.[0]?.id || '' }; }
  async syncTemplates(input: { accessToken: string; businessAccountId: string }): Promise<MetaTemplate[]> { const r = await this.request<{ data?: MetaTemplate[] }>(`/${input.businessAccountId}/message_templates`, input.accessToken); return r.data || []; }
}
