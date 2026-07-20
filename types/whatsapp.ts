import { Organization } from './organization';

export type WhatsappAccountStatus = 'CONNECTED' | 'DISCONNECTED';

export interface WhatsappAccount {
  id: string;
  organizationId: string;
  name: string;
  phoneNumber: string;
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  verifyToken: string;
  webhookSecret?: string | null;
  status: WhatsappAccountStatus;
  connectedAt?: string | null;
  lastSyncAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  organization?: Pick<Organization, 'id' | 'name' | 'active'>;
}

export interface WhatsappTemplate {
  id: string;
  organizationId: string;
  name: string;
  category: string;
  language: string;
  status: string;
  components: unknown;
  createdAt: string;
  updatedAt: string;
  organization?: Pick<Organization, 'id' | 'name' | 'active'>;
}

export interface WhatsappAccountFormData {
  organizationId: string;
  name: string;
  phoneNumber: string;
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  verifyToken: string;
  webhookSecret?: string;
  status?: WhatsappAccountStatus;
}

export interface WhatsappListParams { organizationId?: string; }
export interface SyncWhatsappTemplatesData { organizationId: string; accountId: string; }
