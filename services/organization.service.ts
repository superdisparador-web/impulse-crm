import { api } from './api';
import { Organization, OrganizationFormData, OrganizationListParams, OrganizationListResponse } from '@/types/organization';


function toQueryString(params: OrganizationListParams) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

class OrganizationService {
  async getAll(params: OrganizationListParams = {}): Promise<OrganizationListResponse> {
    return api.get<OrganizationListResponse>(`/organizations${toQueryString(params)}`);
  }

  async create(data: OrganizationFormData): Promise<Organization> {
    return api.post<Organization>('/organizations', data);
  }

  async update(id: string, data: Partial<OrganizationFormData>): Promise<Organization> {
    return api<Organization>(`/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateStatus(id: string, active: boolean): Promise<Organization> {
    return api<Organization>(`/organizations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
  }

  async delete(id: string): Promise<void> {
    await api.delete<void>(`/organizations/${id}`);
  }
}

export const organizationService = new OrganizationService();
