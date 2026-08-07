import { api } from "./api";
import {
  getAccessToken,
  getSession,
  getRefreshToken,
  login as startSession,
  logout as endSession,
  SessionUser,
} from "./session";

export type AuthenticatedUser = SessionUser;

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
  user: AuthenticatedUser;
}

export async function login(email: string, password: string) {
  const response = await api<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  startSession(response);

  return response;
}

export async function logout() {
  const refreshToken = getRefreshToken();
  try {
    if (getAccessToken())
      await api.post<{ success: boolean }>("/auth/logout", { refreshToken });
  } finally {
    endSession();
  }
}

export function getToken() {
  return getAccessToken();
}

export function getCurrentUser(): AuthenticatedUser | null {
  return getSession()?.user ?? null;
}

export function isGlobalAdmin() {
  const user = getCurrentUser();

  return user?.role === "ADMIN" && !user.organizationId;
}

export function isAuthenticated() {
  return !!getToken();
}
