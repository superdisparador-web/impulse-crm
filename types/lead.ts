import { Organization } from './organization';
import { User } from './user';

export type LeadSource = 'MANUAL' | 'IMPORT' | 'WHATSAPP' | 'CAMPAIGN' | 'FACEBOOK' | 'INSTAGRAM' | 'LANDING_PAGE' | 'REFERRAL' | 'PHONE' | 'OTHER';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED' | 'LOST';
export type LeadTemperature = 'COLD' | 'WARM' | 'HOT';
export type LeadHistoryAction = 'CREATED' | 'UPDATED' | 'STATUS_CHANGED' | 'TEMPERATURE_CHANGED' | 'ASSIGNED' | 'UNASSIGNED' | 'DELETED' | 'MOVED';

export interface LeadHistory { id: string; action: LeadHistoryAction; description: string; metadata?: unknown; createdAt: string; performedByUser?: Pick<User, 'id' | 'name' | 'email'> | null; }
export interface Lead { id: string; name: string; phone: string; normalizedPhone: string; email?: string | null; document?: string | null; source: LeadSource; status: LeadStatus; temperature: LeadTemperature; notes?: string | null; organizationId: string; assignedUserId?: string | null; organization?: Pick<Organization, 'id' | 'name' | 'active'>; pipelineId?: string | null; stageId?: string | null; pipeline?: { id: string; name: string; active: boolean; organizationId: string } | null; stage?: { id: string; name: string; order: number; color: string; active: boolean; pipelineId: string } | null; assignedUser?: Pick<User, 'id' | 'name' | 'email' | 'phone' | 'role' | 'active' | 'organizationId'> | null; history?: LeadHistory[]; createdAt: string; updatedAt: string; deletedAt?: string | null; }
export interface LeadFormData { name: string; phone: string; email?: string | null; document?: string | null; source?: LeadSource; status?: LeadStatus; temperature?: LeadTemperature; notes?: string | null; organizationId: string; assignedUserId?: string | null; pipelineId?: string | null; stageId?: string | null; }
export interface LeadListParams { page?: number; limit?: number; search?: string; status?: LeadStatus | ''; temperature?: LeadTemperature | ''; source?: LeadSource | ''; organizationId?: string; assignedUserId?: string; pipelineId?: string; stageId?: string; assigned?: boolean | ''; order?: 'asc' | 'desc'; }
export interface LeadListResponse { items: Lead[]; meta: { total: number; page: number; limit: number; totalPages: number }; }
