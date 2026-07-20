import { api } from './api';
import { ListUsersParams, User, UserFormData, UserListResponse } from '@/types/user';

function toQueryString(params: ListUsersParams) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') searchParams.set(key, String(value));
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

class UserService {
  async getAll(params: ListUsersParams = {}): Promise<UserListResponse> {
    return api.get<UserListResponse>(`/users${toQueryString(params)}`);
  }

  async create(data: UserFormData): Promise<User> {
    return api.post<User>('/users', data);
  }

  async update(id: string, data: UserFormData): Promise<User> {
    const payload: Omit<UserFormData, 'password'> = { ...data };
    delete (payload as Partial<UserFormData>).password;
    return api<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  }

  async updateStatus(id: string, active: boolean): Promise<User> {
    return api<User>(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active }) });
  }

  async delete(id: string): Promise<void> {
    await api.delete<void>(`/users/${id}`);
  }
}

export const userService = new UserService();
