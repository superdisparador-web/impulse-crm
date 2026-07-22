export type MetaSendResult = { externalMessageId: string };
export type MetaTemplate = { id?: string; name: string; language: string; category: string; status: string; components: unknown[] };
export abstract class MetaWhatsappClient {
  abstract testConnection(input: { accessToken: string; phoneNumberId: string }): Promise<{ ok: boolean; qualityRating?: string; messagingLimitTier?: string }>;
  abstract sendText(input: { accessToken: string; phoneNumberId: string; to: string; text: string; replyToExternalMessageId?: string }): Promise<MetaSendResult>;
  abstract sendTemplate(input: { accessToken: string; phoneNumberId: string; to: string; name: string; language: string; components?: unknown[] }): Promise<MetaSendResult>;
  abstract sendMedia(input: { accessToken: string; phoneNumberId: string; to: string; type: string; mediaId: string; caption?: string }): Promise<MetaSendResult>;
  abstract syncTemplates(input: { accessToken: string; businessAccountId: string }): Promise<MetaTemplate[]>;
}
