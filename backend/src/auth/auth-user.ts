import { Request } from 'express';

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
  organizationId?: string | null;
}

export type AuthRequest = Request & { user?: AuthUser };
