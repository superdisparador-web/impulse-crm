import { UserRole } from "@/types/user";

const ACCESS_TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string | null;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;

  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const storedUser = localStorage.getItem(USER_KEY);
  if (!accessToken || !refreshToken || !storedUser) return null;

  try {
    return { accessToken, refreshToken, user: JSON.parse(storedUser) as SessionUser };
  } catch {
    clearSession();
    return null;
  }
}

export function setSession(session: Session) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function login(session: Session) {
  setSession(session);
}

export function updateTokens(accessToken: string, refreshToken?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function logout() {
  clearSession();
}
