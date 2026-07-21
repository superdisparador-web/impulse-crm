import { Lead } from './lead';
import { User } from './user';
import { WhatsappAccount, WhatsappTemplate } from './whatsapp';
export type CampaignStatus = 'DRAFT'|'SCHEDULED'|'PROCESSING'|'PAUSED'|'COMPLETED'|'CANCELED'|'FAILED';
export type CampaignRecipientStatus = 'PENDING'|'QUEUED'|'SENT'|'DELIVERED'|'READ'|'CLICKED'|'FAILED'|'SKIPPED';
export interface CampaignRecipient { id:string; campaignId:string; leadId?:string|null; phone:string; name?:string|null; status:CampaignRecipientStatus; errorMessage?:string|null; messageId?:string|null; assignedUserId?:string|null; lead?:Lead|null; assignedUser?:Pick<User,'id'|'name'|'email'>|null; createdAt:string; updatedAt:string; }
export interface CampaignMetrics { totalContacts:number; totalQueued:number; totalSent:number; totalDelivered:number; totalRead:number; totalFailed:number; totalClicked:number; }
export interface Campaign extends CampaignMetrics { id:string; organizationId:string; name:string; description?:string|null; status:CampaignStatus; whatsappAccountId?:string|null; whatsappTemplateId?:string|null; scheduledAt?:string|null; startedAt?:string|null; finishedAt?:string|null; createdById:string; createdAt:string; updatedAt:string; deletedAt?:string|null; whatsappAccount?:WhatsappAccount|null; whatsappTemplate?:WhatsappTemplate|null; createdBy?:Pick<User,'id'|'name'|'email'>; recipients?:CampaignRecipient[]; _count?:{recipients:number}; }
export interface CreateCampaignPayload { name:string; description?:string; whatsappAccountId?:string; whatsappTemplateId?:string; scheduledAt?:string; }
export type UpdateCampaignPayload = Partial<CreateCampaignPayload>;
export interface CampaignFilters { page?:number; limit?:number; search?:string; status?:CampaignStatus|''; whatsappAccountId?:string; whatsappTemplateId?:string; from?:string; to?:string; }
export interface CampaignListResponse { items:Campaign[]; meta:{ total:number; page:number; limit:number; totalPages:number }; }
export interface AddRecipientsPayload { leadIds?:string[]; search?:string; status?:string; source?:string; assignedUserId?:string; temperature?:string; }
