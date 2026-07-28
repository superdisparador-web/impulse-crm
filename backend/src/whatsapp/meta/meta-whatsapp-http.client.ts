import { Injectable } from '@nestjs/common';
import { MetaAccountConnection, MetaAccountConnectionInput, MetaContact, MetaMediaUpload, MetaSendResult, MetaTemplate, MetaWhatsappClient } from './meta-whatsapp.client';
import { WhatsappCredentialCryptoService } from '../security/credential-crypto.service';

@Injectable()
export class MetaWhatsappHttpClient extends MetaWhatsappClient {
  constructor(private readonly crypto:WhatsappCredentialCryptoService){super();}
  private readonly graphVersion = process.env.META_GRAPH_API_VERSION || 'v23.0';
  private readonly timeoutMs = Number(process.env.META_WHATSAPP_TIMEOUT_MS || 8000);
  private readonly maxTemplatePages = Number(process.env.META_TEMPLATE_MAX_PAGES || 100);
  private base(apiVersion?: string | null) { return `https://graph.facebook.com/${apiVersion || this.graphVersion}`; }
  private metaError(body: unknown, status: number) { const error = body && typeof body === 'object' && 'error' in body && body.error && typeof body.error === 'object' ? body.error as Record<string, unknown> : {}; const metaCode=Number(error.code); const message=String(error.message || status).replace(/(access_token=|Bearer\s+)[^&\s]+/gi, '$1[REDACTED]').slice(0,400); const code=metaCode===190||status===401?'WHATSAPP_INVALID_ACCESS_TOKEN':metaCode===10||metaCode===200||status===403||/permission|authorized|access denied/i.test(message)?'WHATSAPP_INSUFFICIENT_PERMISSION':'WHATSAPP_META_API_ERROR'; return Object.assign(new Error(`${String(error.type || 'Meta API error').slice(0,80)}${error.code?` (${String(error.code).slice(0,20)})`:''}: ${message}`),{code}); }
  private async request<T>(urlOrPath: string, token: string, init: RequestInit = {}, apiVersion?: string | null): Promise<T> {
    const url = new URL(urlOrPath.startsWith('http') ? urlOrPath : `${this.base(apiVersion)}${urlOrPath}`);
    if (url.protocol !== 'https:' || url.hostname !== 'graph.facebook.com') throw new Error('WHATSAPP_META_PAGING_URL_INVALID');
    url.searchParams.delete('access_token');
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try { const res = await fetch(url, { ...init, signal: controller.signal, headers: { ...(init.body instanceof FormData?{}:{'content-type':'application/json'}), authorization: `Bearer ${token}`, ...(init.headers || {}) } }); const body: unknown = await res.json().catch(() => ({})); if (!res.ok) throw this.metaError(body, res.status); return body as T; }
    catch (error) { if ((error as Error).name === 'AbortError') throw new Error('WHATSAPP_META_REQUEST_TIMEOUT'); throw error; }
    finally { clearTimeout(timeout); }
  }
  async testConnection(input: MetaAccountConnectionInput): Promise<MetaAccountConnection> {
    if (input.businessAccountId && input.businessAccountId !== input.wabaId) {
      const owned = await this.request<{data?:{id:string}[]}>(`/${encodeURIComponent(input.businessAccountId)}/owned_whatsapp_business_accounts?fields=id&limit=100`, input.accessToken, {}, input.apiVersion);
      if (!(owned.data || []).some(account => account.id === input.wabaId)) throw Object.assign(new Error('A WABA configurada não pertence ao Business Account informado'), {code:'WHATSAPP_WABA_NOT_OWNED_BY_BUSINESS'});
    }
    const response = await this.request<{data?:{id:string;verified_name?:string;display_phone_number?:string;quality_rating?:string}[]}>(`/${encodeURIComponent(input.wabaId)}/phone_numbers?fields=id,verified_name,display_phone_number,quality_rating&limit=100`, input.accessToken, {}, input.apiVersion);
    const phone = (response.data || []).find(item => item.id === input.phoneNumberId);
    if (!phone) throw Object.assign(new Error('O Phone Number ID configurado não foi encontrado na WABA'), {code:'WHATSAPP_PHONE_NOT_FOUND_IN_WABA'});
    return {ok:true,phoneNumberId:phone.id,wabaId:input.wabaId,displayPhoneNumber:phone.display_phone_number,verifiedName:phone.verified_name,qualityRating:phone.quality_rating};
  }
  syncAccount(input: MetaAccountConnectionInput): Promise<MetaAccountConnection> { return this.testConnection(input); }
  private async message(path:string, token:string, body:unknown){ const r=await this.request<{messages?:{id:string}[]}>(path,token,{method:'POST',body:JSON.stringify(body)}); return {externalMessageId:r.messages?.[0]?.id||''}; }
  sendText(i:{accessToken:string;phoneNumberId:string;to:string;text:string;replyToExternalMessageId?:string}):Promise<MetaSendResult>{ return this.message(`/${i.phoneNumberId}/messages`,i.accessToken,{messaging_product:'whatsapp',to:i.to,type:'text',text:{body:i.text},...(i.replyToExternalMessageId?{context:{message_id:i.replyToExternalMessageId}}:{})}); }
  sendTemplate(i:{accessToken:string;phoneNumberId:string;to:string;name:string;language:string;components?:unknown[]}):Promise<MetaSendResult>{ return this.message(`/${i.phoneNumberId}/messages`,i.accessToken,{messaging_product:'whatsapp',to:i.to,type:'template',template:{name:i.name,language:{code:i.language},components:i.components||[]}}); }
  sendContacts(i:{accessToken:string;phoneNumberId:string;to:string;contacts:MetaContact[]}):Promise<MetaSendResult>{ return this.message(`/${i.phoneNumberId}/messages`,i.accessToken,{messaging_product:'whatsapp',to:i.to,type:'contacts',contacts:i.contacts.map(c=>({name:{formatted_name:c.displayName},phones:[{phone:c.phoneE164.replace('+',''),type:'CELL',wa_id:c.phoneE164.replace('+','')}]}))}); }
  sendMedia(i:{accessToken:string;phoneNumberId:string;to:string;type:string;mediaId:string;caption?:string}):Promise<MetaSendResult>{ return this.message(`/${i.phoneNumberId}/messages`,i.accessToken,{messaging_product:'whatsapp',to:i.to,type:i.type,[i.type]:{id:i.mediaId,caption:i.caption}}); }
  async uploadMedia(i:{encryptedAccessToken:string;phoneNumberId:string;apiVersion?:string|null;bytes:Uint8Array;mimeType:string;fileName:string}):Promise<MetaMediaUpload>{const token=this.crypto.decrypt(i.encryptedAccessToken);const form=new FormData();form.set('messaging_product','whatsapp');form.set('type',i.mimeType);form.set('file',new Blob([i.bytes as BlobPart],{type:i.mimeType}),i.fileName);const r=await this.request<{id?:string}>(`/${encodeURIComponent(i.phoneNumberId)}/media`,token,{method:'POST',body:form,headers:{}},i.apiVersion);if(!r.id)throw new Error('WHATSAPP_META_MEDIA_ID_MISSING');return{mediaId:r.id};}
  async syncTemplates(input: { accessToken: string; businessAccountId: string; apiVersion?: string | null }): Promise<MetaTemplate[]> {
    const fields='id,name,language,category,status,components,quality_score,rejected_reason,parameter_format,previous_category,created_time';
    let next:string|undefined=`/${encodeURIComponent(input.businessAccountId)}/message_templates?fields=${fields}&limit=100`;
    const templates:MetaTemplate[]=[]; const cursors=new Set<string>();
    for(let page=0;next;page++) { if(page>=this.maxTemplatePages) throw new Error('WHATSAPP_META_PAGING_LIMIT_EXCEEDED'); const r=await this.request<{data?:MetaTemplate[];paging?:{next?:string;cursors?:{after?:string}}}>(next,input.accessToken,{},input.apiVersion); templates.push(...(r.data||[])); const cursor=r.paging?.cursors?.after; if(cursor&&cursors.has(cursor)) throw new Error('WHATSAPP_META_PAGING_LOOP_DETECTED'); if(cursor)cursors.add(cursor); next=r.paging?.next; }
    return templates;
  }
}
