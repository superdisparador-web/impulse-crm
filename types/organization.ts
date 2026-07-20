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
}

export interface OrganizationFormData {
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  active?: boolean;
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
