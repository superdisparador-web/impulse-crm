import { QueueStatus } from './message-queue';
export interface MessageLog { id:string; queueId:string; campaignId:string; recipientId?:string|null; status:QueueStatus; message:string; response?:Record<string,unknown>|null; createdAt:string; queue?:{id:string;priority:string;attempt:number;maxAttempts:number}; }
export interface MessageLogFilters { page?:number; limit?:number; queueId?:string; campaignId?:string; recipientId?:string; status?:QueueStatus|''; }
export interface MessageLogListResponse { items:MessageLog[]; meta:{total:number;page:number;limit:number;totalPages:number}; }
