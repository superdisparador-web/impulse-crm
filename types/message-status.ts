export type MetaMessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'CANCELED';

export type MessageStatusHistory = { id: string; whatsappAccountId?: string | null; phoneNumberId?: string | null; metaMessageId: string; status: MetaMessageStatus; recipientPhone?: string | null; conversationId?: string | null; occurredAt: string; createdAt: string };
