import { User } from './user';
import { Lead } from './lead';
import { WhatsappAccount, WhatsappTemplate } from './whatsapp';
export type CampaignStatus = 'DRAFT'|'SCHEDULED'|'RUNNING'|'PAUSED'|'COMPLETED'|'CANCELED'|'FAILED'|'PROCESSING';
export type CampaignType = 'MARKETING'|'UTILITY'|'AUTHENTICATION';
export type CampaignFilterField = 'city'|'source'|'pipelineId'|'stageId'|'status'|'managerId'|'brokerId'|'date'|'temperature'|'archived';
export type CampaignFilterOperator = 'equals'|'in'|'between'|'gte'|'lte'|'contains'|'is';
export interface CampaignFilter { id?:string; campaignId?:string; field:CampaignFilterField; operator:CampaignFilterOperator; value:string|string[]|boolean|{from?:string;to?:string}; }
export type CampaignRecipientStatus = 'PENDING'|'QUEUED'|'SENT'|'DELIVERED'|'READ'|'CLICKED'|'FAILED'|'SKIPPED';
export interface CampaignRecipient { id:string; campaignId:string; leadId?:string|null; phone:string; name?:string|null; status:CampaignRecipientStatus; errorMessage?:string|null; messageId?:string|null; assignedUserId?:string|null; lead?:Lead|null; assignedUser?:Pick<User,'id'|'name'|'email'>|null; createdAt:string; updatedAt:string; }
export interface CampaignMetrics { totalContacts:number; totalQueued:number; totalSent:number; totalDelivered:number; totalRead:number; totalFailed:number; totalClicked:number; }
export interface Campaign extends Partial<CampaignMetrics> { id:string; organizationId:string; name:string; description?:string|null; status:CampaignStatus; campaignType:CampaignType; whatsappAccountId?:string|null; whatsappTemplateId?:string|null; scheduledAt?:string|null; startedAt?:string|null; finishedAt?:string|null; archivedAt?:string|null; createdById:string; createdAt:string; updatedAt:string; deletedAt?:string|null; filters?:CampaignFilter[]; recipients?:CampaignRecipient[]; whatsappAccount?:WhatsappAccount|null; whatsappTemplate?:WhatsappTemplate|null; createdBy?:Pick<User,'id'|'name'|'email'>; _count?:{recipients:number; filters:number}; }
export interface CreateCampaignPayload { name:string; description?:string; campaignType:CampaignType; scheduledAt?:string; filters?:CampaignFilter[]; }
export type UpdateCampaignPayload = Partial<CreateCampaignPayload> & { status?: CampaignStatus; whatsappAccountId?:string|null; whatsappTemplateId?:string|null };
export interface CampaignFilters { page?:number; limit?:number; search?:string; status?:CampaignStatus|''; campaignType?:CampaignType|''; archived?:boolean; deleted?:boolean; from?:string; to?:string; }
export interface CampaignListResponse { items:Campaign[]; meta:{ total:number; page:number; limit:number; totalPages:number }; }
export interface CampaignEstimateResponse { estimatedContacts:number; }

export interface AddRecipientsPayload { leadIds?:string[]; search?:string; status?:string; source?:string; assignedUserId?:string; temperature?:string; }
