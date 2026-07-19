import { api } from "./api";

export interface Agent {
  id: string;
  companyId: string;
  name: string;
  whatsapp: string;
  email?: string;
  mode?: string;
  weight?: number;
  maxActiveLeads?: number;
  region?: string;
  active: boolean;
}

export interface CreateAgentDto {
  companyId: string;
  name: string;
  whatsapp: string;
  email?: string;
  mode?: string;
  weight?: number;
  maxActiveLeads?: number;
  region?: string;
  active?: boolean;
}

class AgentService {
  async getAll(): Promise<Agent[]> {
    return api.get<Agent[]>("/agents");
  }

  async getById(id: string): Promise<Agent> {
    return api.get<Agent>(`/agents/${id}`);
  }

  async create(data: CreateAgentDto): Promise<Agent> {
    return api.post<Agent>("/agents", data);
  }

  async update(
    id: string,
    data: Partial<CreateAgentDto>
  ): Promise<Agent> {
    return api.put<Agent>(`/agents/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await api.delete<void>(`/agents/${id}`);
  }
}

export const agentService = new AgentService();