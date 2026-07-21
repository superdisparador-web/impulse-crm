import { InboundMessageType, MetaMessageStatus } from '@prisma/client';

export type MetaWebhookPayload = {
  object?: string;
  entry?: Array<{ id?: string; changes?: Array<{ field?: string; value?: MetaChangeValue }> }>;
};

export type MetaChangeValue = {
  messaging_product?: string;
  metadata?: { display_phone_number?: string; phone_number_id?: string };
  contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
  messages?: MetaInboundMessage[];
  statuses?: MetaStatus[];
  errors?: unknown[];
};

export type MetaInboundMessage = {
  id: string;
  from: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  image?: MetaMedia;
  audio?: MetaMedia;
  video?: MetaMedia;
  document?: MetaMedia & { filename?: string };
  sticker?: MetaMedia;
  location?: { latitude?: number; longitude?: number; name?: string; address?: string };
  contacts?: unknown[];
  reaction?: { message_id?: string; emoji?: string };
  button?: { text?: string; payload?: string };
  interactive?: unknown;
  errors?: unknown[];
};

export type MetaMedia = { id?: string; mime_type?: string; sha256?: string; caption?: string };
export type MetaStatus = { id: string; status: string; timestamp?: string; recipient_id?: string; conversation?: { id?: string }; pricing?: unknown; errors?: unknown[] };

export const inboundTypeMap: Record<string, InboundMessageType> = {
  text: 'TEXT', audio: 'AUDIO', image: 'IMAGE', video: 'VIDEO', document: 'DOCUMENT', location: 'LOCATION', contacts: 'CONTACT', sticker: 'STICKER', reaction: 'REACTION', button: 'BUTTON', interactive: 'INTERACTIVE',
};
export const statusMap: Record<string, MetaMessageStatus> = { sent: 'SENT', delivered: 'DELIVERED', read: 'READ', failed: 'FAILED', canceled: 'CANCELED' };
