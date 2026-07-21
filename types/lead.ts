import { Organization } from './organization';
import { User } from './user';

export type LeadSource = 'MANUAL' | 'CSV_IMPORT' | 'META_ADS' | 'WEBSITE' | 'PUBLIC_API' | 'WEBHOOK' | 'REFERRAL' | 'ORGANIC' | 'FACEBOOK' | 'INSTAGRAM' | 'LANDING_PAGE' | 'PHONE' | 'OTHER';
export type LeadStatus = 'NEW' | 'ASSIGNED' | 'CONTACT_PENDING' | 'IN_CONTACT' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED' | 'LOST' | 'ARCHIVED';
export type LeadTemperature = 'COLD' | 'WARM' | 'HOT' | 'UNKNOWN';
export type LeadEventType = 'LEAD_CREATED' | 'LEAD_UPDATED' | 'LEAD_ASSIGNED' | 'LEAD_UNASSIGNED' | 'LEAD_STATUS_CHANGED' | 'LEAD_TEMPERATURE_CHANGED' | 'LEAD_ARCHIVED' | 'LEAD_CONVERTED' | 'LEAD_LOST' | 'LEAD_DUPLICATE_DETECTED' | 'LEAD_ACTIVITY_CREATED' | 'LEAD_ACTIVITY_UPDATED' | 'LEAD_ACTIVITY_COMPLETED';
export type LeadActivityStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
export type LeadActivityPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface LeadExternalIdentity { id: string; provider: string; externalId: string; externalAccountId?: string | null; metadata?: unknown; }
export interface LeadEvent { id: string; eventType: LeadEventType; description: string; payload?: unknown; occurredAt: string; createdAt: string; actorUser?: Pick<User, 'id' | 'name' | 'email'> | null; }
export interface LeadActivity { id: string; title: string; dueAt: string; status: LeadActivityStatus; priority: LeadActivityPriority; note?: string | null; completedAt?: string | null; responsibleUserId: string; createdByUserId: string; responsibleUser?: Pick<User, 'id' | 'name' | 'email'>; createdByUser?: Pick<User, 'id' | 'name' | 'email'>; createdAt: string; updatedAt: string; }
export interface Lead { id: string; name?: string | null; phone?: string | null; normalizedPhone?: string | null; email?: string | null; normalizedEmail?: string | null; document?: string | null; source: LeadSource; status: LeadStatus; temperature: LeadTemperature; score: number; notes?: string | null; organizationId: string; assignedUserId?: string | null; managerUserId?: string | null; organization?: Pick<Organization, 'id' | 'name' | 'active'>; assignedUser?: Pick<User, 'id' | 'name' | 'email' | 'phone' | 'role' | 'active' | 'organizationId'> | null; managerUser?: Pick<User, 'id' | 'name' | 'email' | 'phone' | 'role' | 'active' | 'organizationId'> | null; externalIdentities?: LeadExternalIdentity[]; events?: LeadEvent[]; activities?: LeadActivity[]; createdAt: string; updatedAt: string; deletedAt?: string | null; archivedAt?: string | null; }
export interface LeadExternalIdentityFormData { provider: string; externalId: string; externalAccountId?: string | null; }
export interface LeadFormData { name?: string | null; phone?: string | null; email?: string | null; document?: string | null; source?: LeadSource; status?: LeadStatus; temperature?: LeadTemperature; notes?: string | null; organizationId: string; assignedUserId?: string | null; managerUserId?: string | null; externalIdentity?: LeadExternalIdentityFormData; }
export interface LeadActivityFormData { title: string; dueAt: string; status?: LeadActivityStatus; priority?: LeadActivityPriority; note?: string | null; responsibleUserId: string; }
export interface LeadListParams { page?: number; limit?: number; search?: string; status?: LeadStatus | ''; temperature?: LeadTemperature | ''; source?: LeadSource | ''; organizationId?: string; assignedUserId?: string; assigned?: boolean | ''; order?: 'asc' | 'desc'; }
export interface LeadListResponse { items: Lead[]; meta: { total: number; page: number; limit: number; totalPages: number }; }
