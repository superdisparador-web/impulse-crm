export type UserRole = 'ADMIN' | 'CORRETOR';

export interface UserOrganization {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  active: boolean;
  organization?: UserOrganization | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: UserRole;
  active?: boolean;
}

export interface UserListResponse {
  items: User[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean | '';
}
