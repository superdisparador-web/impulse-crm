import { Injectable } from '@nestjs/common';
import { MetaContact, MetaSendResult, MetaTemplate, MetaWhatsappClient } from './meta-whatsapp.client';

@Injectable()
export class MetaWhatsappHttpClient extends MetaWhatsappClient {
  private readonly graphVersion = process.env.META_GRAPH_API_VERSION || 'v23.0';
  private readonly timeoutMs = Number(process.env.META_WHATSAPP_TIMEOUT_MS || 8000);
  private readonly maxTemplatePages = Number(process.env.META_TEMPLATE_MAX_PAGES || 100);
  private base(apiVersion?: string | null) { return `https://graph.facebook.com/${apiVersion || this.graphVersion}`; }
  private sanitizeMetaError(body: unknown, status: number) { const error = body && typeof body === 'object' && 'error' in body && body.error && typeof body.error === 'object' ? body.error as Record<string, unknown> : {}; const code = error.code ? ` (${String(error.code).slice(0, 20)})` : ''; return `${String(error.type || 'Meta API error').slice(0, 80)}${code}: ${String(error.message || status).replace(/(access_token=|Bearer\s+)[^&\s]+/gi, '$1[REDACTED]').slice(0, 400)}`; }
  private async request<T>(urlOrPath: string, token: string, init: RequestInit = {}, apiVersion?: string | null): Promise<T> {
    const url = new URL(urlOrPath.startsWith('http') ? urlOrPath : `${this.base(apiVersion)}${urlOrPath}`);
    if (url.protocol !== 'https:' || url.hostname !== 'graph.facebook.com') throw new Error('WHATSAPP_META_PAGING_URL_INVALID');
    url.searchParams.delete('access_token');
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try { const res = await fetch(url, { ...init, signal: controller.signal, headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, ...(init.headers || {}) } }); const body: unknown = await res.json().catch(() => ({})); if (!res.ok) throw new Error(this.sanitizeMetaError(body, res.status)); return body as T; }
    catch (error) { if ((error as Error).name === 'AbortError') throw new Error('WHATSAPP_META_REQUEST_TIMEOUT'); throw error; }
    finally { clearTimeout(timeout); }
  }
  async testConnection(input: { accessToken: string; phoneNumberId: string; apiVersion?: string | null }) { const r = await this.request<{id:string;whatsapp_business_account?:{id:string};display_phone_number?:string;verified_name?:string;quality_rating?:string;messaging_limit_tier?:string}>(`/${encodeURIComponent(input.phoneNumberId)}?fields=id,whatsapp_business_account,display_phone_number,verified_name,quality_rating,messaging_limit_tier`, input.accessToken, {}, input.apiVersion); return { ok: true, phoneNumberId: r.id, wabaId: r.whatsapp_business_account?.id, displayPhoneNumber: r.display_phone_number, verifiedName: r.verified_name, qualityRating: r.quality_rating, messagingLimitTier: r.messaging_limit_tier }; }
  async syncAccount(input: { accessToken: string; phoneNumberId: string; apiVersion?: string | null }) { const r = await this.testConnection(input); return { displayPhoneNumber: r.displayPhoneNumber, verifiedName: r.verifiedName, qualityRating: r.qualityRating, messagingLimitTier: r.messagingLimitTier }; }
  private async message(path:string, token:string, body:unknown){ const r=await this.request<{messages?:{id:string}[]}>(path,token,{method:'POST',body:JSON.stringify(body)}); return {externalMessageId:r.messages?.[0]?.id||''}; }
  sendText(i:{accessToken:string;phoneNumberId:string;to:string;text:string;replyToExternalMessageId?:string}):Promise<MetaSendResult>{ return this.message(`/${i.phoneNumberId}/messages`,i.accessToken,{messaging_product:'whatsapp',to:i.to,type:'text',text:{body:i.text},...(i.replyToExternalMessageId?{context:{message_id:i.replyToExternalMessageId}}:{})}); }
  sendTemplate(i:{accessToken:string;phoneNumberId:string;to:string;name:string;language:string;components?:unknown[]}):Promise<MetaSendResult>{ return this.message(`/${i.phoneNumberId}/messages`,i.accessToken,{messaging_product:'whatsapp',to:i.to,type:'template',template:{name:i.name,language:{code:i.language},components:i.components||[]}}); }
  sendContacts(i:{accessToken:string;phoneNumberId:string;to:string;contacts:MetaContact[]}):Promise<MetaSendResult>{ return this.message(`/${i.phoneNumberId}/messages`,i.accessToken,{messaging_product:'whatsapp',to:i.to,type:'contacts',contacts:i.contacts.map(c=>({name:{formatted_name:c.displayName},phones:[{phone:c.phoneE164.replace('+',''),type:'CELL',wa_id:c.phoneE164.replace('+','')}]}))}); }
  sendMedia(i:{accessToken:string;phoneNumberId:string;to:string;type:string;mediaId:string;caption?:string}):Promise<MetaSendResult>{ return this.message(`/${i.phoneNumberId}/messages`,i.accessToken,{messaging_product:'whatsapp',to:i.to,type:i.type,[i.type]:{id:i.mediaId,caption:i.caption}}); }
  async syncTemplates(input: { accessToken: string; businessAccountId: string; apiVersion?: string | null }): Promise<MetaTemplate[]> {
    const fields='id,name,language,category,status,components,quality_score,rejected_reason,parameter_format,previous_category,created_time';
    let next:string|undefined=`/${encodeURIComponent(input.businessAccountId)}/message_templates?fields=${fields}&limit=100`;
    const templates:MetaTemplate[]=[]; const cursors=new Set<string>();
    for(let page=0;next;page++) { if(page>=this.maxTemplatePages) throw new Error('WHATSAPP_META_PAGING_LIMIT_EXCEEDED'); const r=await this.request<{data?:MetaTemplate[];paging?:{next?:string;cursors?:{after?:string}}}>(next,input.accessToken,{},input.apiVersion); templates.push(...(r.data||[])); const cursor=r.paging?.cursors?.after; if(cursor&&cursors.has(cursor)) throw new Error('WHATSAPP_META_PAGING_LOOP_DETECTED'); if(cursor)cursors.add(cursor); next=r.paging?.next; }
    return templates;
  }
}
