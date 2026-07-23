export type WhatsappAccountStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'DISCONNECTED' | 'ERROR' | 'SUSPENDED';

export interface PaginatedWhatsappAccounts {
  items: WhatsappAccount[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface WhatsappAccount {
  id: string;
  organizationId: string;
  name: string;
  phoneNumber: string;
  normalizedPhone: string;
  displayPhoneNumber?: string | null;
  verifiedName?: string | null;
  phoneNumberId: string;
  businessAccountId: string;
  appId?: string | null;
  apiVersion?: string | null;
  status: WhatsappAccountStatus;
  isDefault: boolean;
  qualityRating?: string | null;
  messagingLimitTier?: string | null;
  connectedAt?: string | null;
  lastSyncAt?: string | null;
  lastConnectionTestAt?: string | null;
  lastConnectionError?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
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
}

export interface WhatsappAccountFormData {
  name: string;
  phoneNumber?: string;
  phoneNumberId: string;
  businessAccountId: string;
  credential?: string;
  apiVersion?: string;
  active?: boolean;
}

export interface WhatsappListParams {
  search?: string;
  status?: string;
  state?: 'active' | 'inactive' | 'archived' | 'all';
  page?: number;
  pageSize?: number;
}
export interface SyncWhatsappTemplatesData { accountId: string; }
