export type MetaSendResult = { externalMessageId: string };
export type MetaContact = { displayName: string; phoneE164: string };
export type MetaTemplate = { id?: string; name: string; language: string; category: string; status: string; components: unknown[] };
export type MetaEmbeddedAsset = { businessId: string; businessName: string; wabaId: string; wabaName: string; phoneNumberId: string; displayPhoneNumber: string; verifiedName?: string; qualityRating?: string; status?: string };
export abstract class MetaWhatsappClient {
  abstract exchangeCode(code: string): Promise<{ accessToken: string; expiresAt: Date | null }>;
  abstract renewToken(token: string): Promise<{ accessToken: string; expiresAt: Date | null }>;
  abstract inspectToken(token: string): Promise<{ valid: boolean; expiresAt: Date | null; scopes: string[]; type?: string }>;
  abstract discoverEmbeddedAssets(token: string): Promise<MetaEmbeddedAsset[]>;
  abstract testConnection(input: { accessToken: string; phoneNumberId: string; apiVersion?: string | null }): Promise<{ ok: boolean; displayPhoneNumber?: string; verifiedName?: string; qualityRating?: string; messagingLimitTier?: string }>;
  abstract syncAccount(input: { accessToken: string; phoneNumberId: string; apiVersion?: string | null }): Promise<{ displayPhoneNumber?: string; verifiedName?: string; qualityRating?: string; messagingLimitTier?: string }>;
  abstract sendText(input: { accessToken: string; phoneNumberId: string; to: string; text: string; replyToExternalMessageId?: string }): Promise<MetaSendResult>;
  abstract sendTemplate(input: { accessToken: string; phoneNumberId: string; to: string; name: string; language: string; components?: unknown[] }): Promise<MetaSendResult>;
  abstract sendContacts(input: { accessToken: string; phoneNumberId: string; to: string; contacts: MetaContact[] }): Promise<MetaSendResult>;
  abstract sendMedia(input: { accessToken: string; phoneNumberId: string; to: string; type: string; mediaId: string; caption?: string }): Promise<MetaSendResult>;
  abstract syncTemplates(input: { accessToken: string; businessAccountId: string }): Promise<MetaTemplate[]>;
}
