import { api } from './api';
import { EmbeddedSignupConfig, EmbeddedSignupResult, PaginatedWhatsappAccounts, SyncWhatsappTemplatesData, WhatsappAccount, WhatsappListParams, WhatsappTemplate } from '@/types/whatsapp';
function query(params:WhatsappListParams={}){const q=new URLSearchParams();Object.entries(params).forEach(([k,v])=>{if(v!==undefined&&v!=='')q.set(k,String(v));});return q.size?`?${q}`:'';}
class WhatsappService {
 getAccounts(params:WhatsappListParams={}){return api.get<PaginatedWhatsappAccounts>(`/whatsapp/accounts${query(params)}`);}
 getEmbeddedSignupConfig(accountId?:string){return api.get<EmbeddedSignupConfig>(`/whatsapp/embedded-signup/config${accountId?`?accountId=${encodeURIComponent(accountId)}`:''}`);}
 completeEmbeddedSignup(data:{code:string;state:string;accountId?:string}){return api.post<EmbeddedSignupResult>('/whatsapp/embedded-signup/complete',data);}
 syncAccount(id:string){return api.post<WhatsappAccount>(`/whatsapp/accounts/${id}/sync`,{});}
 syncTemplates(data:SyncWhatsappTemplatesData){return api.post<{success:boolean;count:number}>('/whatsapp/templates/sync',data);}
 getTemplates(params:WhatsappListParams={}){return api.get<WhatsappTemplate[]>(`/whatsapp/templates${query(params)}`);}
}
export const whatsappService=new WhatsappService();
