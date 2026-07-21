export interface OrganizationUsageCounts {
  users: number;
  leads: number;
  whatsappAccounts: number;
  campaigns: number;
  messageQueues: number;
}

export interface Organization {
  id: string;
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  _count?: OrganizationUsageCounts;
}

export interface OrganizationFormData {
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  active?: boolean;
}

export interface OrganizationListParams {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean | '';
}

export interface OrganizationListResponse {
  items: Organization[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
