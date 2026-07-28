export type MetaSendResult = { externalMessageId: string };
export type MetaMediaUpload = { mediaId: string };
export type MetaContact = { displayName: string; phoneE164: string };
export type MetaTemplate = { id?: string; name: string; language: string; category: string; status: string; components: unknown[]; quality_score?: unknown; rejected_reason?: string; parameter_format?: string; previous_category?: string; created_time?: string };
export type MetaAccountConnectionInput = { accessToken: string; wabaId: string; phoneNumberId: string; businessAccountId?: string | null; apiVersion?: string | null };
export type MetaAccountConnection = { ok: boolean; phoneNumberId: string; wabaId: string; displayPhoneNumber?: string; verifiedName?: string; qualityRating?: string };
export abstract class MetaWhatsappClient {
  abstract testConnection(input: MetaAccountConnectionInput): Promise<MetaAccountConnection>;
  abstract syncAccount(input: MetaAccountConnectionInput): Promise<MetaAccountConnection>;
  abstract sendText(input: { accessToken: string; phoneNumberId: string; to: string; text: string; replyToExternalMessageId?: string }): Promise<MetaSendResult>;
  abstract sendTemplate(input: { accessToken: string; phoneNumberId: string; to: string; name: string; language: string; components?: unknown[] }): Promise<MetaSendResult>;
  abstract sendContacts(input: { accessToken: string; phoneNumberId: string; to: string; contacts: MetaContact[] }): Promise<MetaSendResult>;
  abstract sendMedia(input: { accessToken: string; phoneNumberId: string; to: string; type: string; mediaId: string; caption?: string }): Promise<MetaSendResult>;
  abstract uploadMedia(input:{encryptedAccessToken:string;phoneNumberId:string;apiVersion?:string|null;bytes:Uint8Array;mimeType:string;fileName:string}):Promise<MetaMediaUpload>;
  abstract syncTemplates(input: { accessToken: string; businessAccountId: string; apiVersion?: string | null }): Promise<MetaTemplate[]>;
}
