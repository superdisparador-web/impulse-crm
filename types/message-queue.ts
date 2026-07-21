import { Campaign, CampaignRecipient } from './campaign';
export type QueueStatus = 'PENDING'|'WAITING'|'PROCESSING'|'SENT'|'FAILED'|'RETRYING'|'CANCELED';
export type Priority = 'LOW'|'NORMAL'|'HIGH'|'URGENT';
export interface MessageQueue { id:string; organizationId:string; campaignId:string; recipientId?:string|null; whatsappAccountId?:string|null; status:QueueStatus; priority:Priority; attempt:number; maxAttempts:number; scheduledAt:string; startedAt?:string|null; finishedAt?:string|null; lastError?:string|null; payload:Record<string,unknown>; createdAt:string; updatedAt:string; campaign?:Pick<Campaign,'id'|'name'>; recipient?:Pick<CampaignRecipient,'id'|'name'|'phone'>|null; }
export interface MessageQueueFilters { page?:number; limit?:number; search?:string; status?:QueueStatus|''; priority?:Priority|''; campaignId?:string; whatsappAccountId?:string; }
export interface CreateMessageQueuePayload { campaignId:string; whatsappAccountId?:string; scheduledAt?:string; priority?:Priority; maxAttempts?:number; payload?:Record<string,unknown>; recipients?:Array<{recipientId?:string; whatsappAccountId?:string; scheduledAt?:string; priority?:Priority; maxAttempts?:number; payload?:Record<string,unknown>}>; }
export interface MessageQueueListResponse { items:MessageQueue[]; meta:{total:number;page:number;limit:number;totalPages:number}; summary:Partial<Record<QueueStatus,number>>; }
