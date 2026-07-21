export type InboundMessageType = 'TEXT' | 'AUDIO' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION' | 'CONTACT' | 'STICKER' | 'REACTION' | 'BUTTON' | 'INTERACTIVE' | 'UNKNOWN';

export type MediaFile = { id: string; metaMediaId: string; type: InboundMessageType; mimeType?: string | null; fileName?: string | null; downloadStatus: string; createdAt: string };

export type InboundMessage = {
  id: string;
  whatsappAccountId?: string | null;
  phoneNumberId?: string | null;
  from: string;
  customerName?: string | null;
  metaMessageId: string;
  type: InboundMessageType;
  text?: string | null;
  receivedAt: string;
  createdAt: string;
  mediaFiles?: MediaFile[];
};
