export interface Agent {
  id: string;
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
  name: string;
  whatsapp: string;
  email?: string;
  mode?: string;
  weight?: number;
  maxActiveLeads?: number;
  region?: string;
  active?: boolean;
}

export interface UpdateAgentDto {
  name?: string;
  whatsapp?: string;
  email?: string;
  mode?: string;
  weight?: number;
  maxActiveLeads?: number;
  region?: string;
  active?: boolean;
}