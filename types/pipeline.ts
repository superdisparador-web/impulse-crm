import { Lead } from './lead';
import { User } from './user';
export type DealStatus = 'OPEN'|'WON'|'LOST'|'REOPENED'|'ARCHIVED';
export type DealActivityType = 'TASK'|'CALL'|'MEETING'|'EMAIL'|'WHATSAPP'|'NOTE'|'FOLLOW_UP';
export type DealActivityStatus = 'OPEN'|'DONE'|'CANCELED'|'OVERDUE';
export interface Pipeline { id:string; organizationId:string; name:string; description?:string|null; isDefault:boolean; isActive:boolean; currency:string; stages?:PipelineStage[]; }
export interface PipelineStage { id:string; organizationId:string; pipelineId:string; name:string; position:number; probability:number; slaHours?:number|null; isInitial:boolean; isActive:boolean; color?:string|null; deals?:Deal[]; meta?:{total:number;limit:number}; }
export interface Tag { id:string; organizationId:string; name:string; slug:string; color?:string|null; }
export interface LossReason { id:string; organizationId:string; pipelineId?:string|null; name:string; }
export interface Deal { id:string; organizationId:string; leadId:string; pipelineId:string; stageId:string; ownerId?:string|null; title:string; status:DealStatus; estimatedValue:string|number; closedValue?:string|number|null; currency:string; expectedCloseDate?:string|null; closedAt?:string|null; wonAt?:string|null; lostAt?:string|null; currentStageEnteredAt:string; stage?:PipelineStage; pipeline?:Pipeline; lead?:Pick<Lead,'id'|'name'|'phone'|'email'>; owner?:Pick<User,'id'|'name'|'email'>|null; tags?:Array<{tag:Tag}>; activities?:DealActivity[]; events?:DealEvent[]; }
export interface DealEvent { id:string; eventType:string; payload:unknown; occurredAt:string; actorUser?:Pick<User,'id'|'name'|'email'>|null; }
export interface DealActivity { id:string; title:string; type:DealActivityType; status:DealActivityStatus; dueAt?:string|null; completedAt?:string|null; }
export interface DealListResponse { items: Deal[]; meta:{total:number;page:number;limit:number;totalPages:number}; }
export interface KanbanResponse { pipeline: Pipeline; stages: PipelineStage[]; }
