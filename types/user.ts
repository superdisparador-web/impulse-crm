export type UserRole =
  "ADMIN" | "CORRETOR" | "GLOBAL_ADMIN" | "ORG_ADMIN" | "MANAGER" | "BROKER";

export interface UserOrganization {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  title?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  active: boolean;
  organizationId?: string | null;
  organization?: UserOrganization | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  permissions?: string[];
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  title?: string;
  role: UserRole;
  organizationId: string;
  active?: boolean;
}

export interface UserListResponse {
  items: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserMetrics {
  total: number;
  active: number;
  inactive: number;
  administrators: number;
  managers: number;
  brokers: number;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean | "";
  organizationId?: string;
  role?: UserRole;
}
