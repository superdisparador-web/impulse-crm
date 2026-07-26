import { User } from './user';
import { Lead } from './lead';
import { WhatsappAccount, WhatsappTemplate } from './whatsapp';
export type CampaignStatus = 'DRAFT'|'VALIDATING'|'READY'|'SCHEDULED'|'QUEUED'|'RUNNING'|'PAUSED'|'COMPLETED'|'COMPLETED_WITH_ERRORS'|'CANCELED'|'FAILED';
export type CampaignType = 'MARKETING'|'UTILITY'|'AUTHENTICATION';
export type CampaignFilterField = 'city'|'source'|'pipelineId'|'stageId'|'status'|'managerId'|'brokerId'|'date'|'temperature'|'archived';
export type CampaignFilterOperator = 'equals'|'in'|'between'|'gte'|'lte'|'contains'|'is';
export interface CampaignFilter { id?:string; campaignId?:string; field:CampaignFilterField; operator:CampaignFilterOperator; value:string|string[]|boolean|{from?:string;to?:string}; }
export type CampaignRecipientStatus = 'PENDING'|'QUEUED'|'PROCESSING'|'SENT'|'DELIVERED'|'READ'|'CLICKED'|'FAILED'|'FAILED_RETRYABLE'|'FAILED_PERMANENT'|'CANCELED'|'SKIPPED'|'UNKNOWN';
export interface CampaignRecipient { id:string; campaignId:string; leadId?:string|null; phone:string; name?:string|null; status:CampaignRecipientStatus; errorMessage?:string|null; messageId?:string|null; assignedUserId?:string|null; lead?:Lead|null; assignedUser?:Pick<User,'id'|'name'|'email'>|null; createdAt:string; updatedAt:string; }
export interface CampaignMetrics { totalContacts:number; totalQueued:number; totalSent:number; totalDelivered:number; totalRead:number; totalFailed:number; totalClicked:number; }
export interface Campaign extends Partial<CampaignMetrics> { id:string; organizationId:string; name:string; description?:string|null; status:CampaignStatus; campaignType:CampaignType; category?:CampaignType|null; internalNotes?:string|null; currentStep?:number; whatsappAccountId?:string|null; whatsappTemplateId?:string|null; variableMappings?:unknown; destinationConfig?:unknown; listConfirmedAt?:string|null; reviewedAt?:string|null; mediaOriginalName?:string|null; mediaMimeType?:string|null; mediaSize?:number|null; scheduledAt?:string|null; startedAt?:string|null; finishedAt?:string|null; archivedAt?:string|null; createdById:string; createdAt:string; updatedAt:string; deletedAt?:string|null; filters?:CampaignFilter[]; recipients?:CampaignRecipient[]; import?:unknown; agents?:unknown[]; whatsappAccount?:WhatsappAccount|null; whatsappTemplate?:WhatsappTemplate|null; createdBy?:Pick<User,'id'|'name'|'email'>; _count?:{recipients:number; filters:number}; }
export interface CreateCampaignPayload { name:string; description?:string; campaignType:CampaignType; scheduledAt?:string; filters?:CampaignFilter[]; whatsappAccountId?:string; internalNotes?:string; }
export type UpdateCampaignPayload = Partial<CreateCampaignPayload> & { status?: CampaignStatus; whatsappAccountId?:string|null; whatsappTemplateId?:string|null };
export interface CampaignFilters { page?:number; limit?:number; search?:string; status?:CampaignStatus|''; campaignType?:CampaignType|''; archived?:boolean; deleted?:boolean; from?:string; to?:string; }
export interface CampaignListResponse { items:Campaign[]; meta:{ total:number; page:number; limit:number; totalPages:number }; }
export interface CampaignEstimateResponse { estimatedContacts:number; }
export interface CampaignProgress {campaignId:string;status:CampaignStatus;total:number;valid:number;queued:number;processing:number;sent:number;delivered:number;read:number;failedRetryable:number;failedPermanent:number;canceled:number;pending:number;unknown:number;completed:number;percentCompleted:number;averagePerSecond:number;estimatedCompletionAt?:string|null;updatedAt:string;}
export interface OperationalRecipient {id:string;name?:string|null;phone:string;status:CampaignRecipientStatus;assignedUser?:Pick<User,'id'|'name'>|null;attemptCount:number;queuedAt?:string|null;processingAt?:string|null;sentAt?:string|null;deliveredAt?:string|null;readAt?:string|null;failedAt?:string|null;errorCategory?:string|null;errorMessage?:string|null;}
export interface OperationalRecipients {items:OperationalRecipient[];meta:{page:number;limit:number;total:number;totalPages:number};}

export interface AddRecipientsPayload { leadIds?:string[]; search?:string; status?:string; source?:string; assignedUserId?:string; temperature?:string; }
