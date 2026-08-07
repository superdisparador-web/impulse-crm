import { UserRole } from "@/types/user";

const ACCESS_TOKEN_KEY = "impulse.auth.accessToken";
const REFRESH_TOKEN_KEY = "impulse.auth.refreshToken";
const USER_KEY = "impulse.auth.user";
const LEGACY_KEYS = [
  "token",
  "accessToken",
  "refreshToken",
  "user",
  "authToken",
  "authUser",
];

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
  if (!accessToken || !refreshToken || !storedUser) {
    if (accessToken || refreshToken || storedUser) clearSession();
    return null;
  }

  try {
    const user = JSON.parse(storedUser) as Partial<SessionUser>;
    if (!user.id || !user.name || !user.email || !user.role)
      throw new Error("Invalid stored user");
    return { accessToken, refreshToken, user: user as SessionUser };
  } catch {
    clearSession();
    return null;
  }
}

export function setSession(session: Session) {
  if (typeof window === "undefined") return;
  clearLegacySession();
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
  clearLegacySession();
}

function clearLegacySession() {
  if (typeof window === "undefined") return;
  for (const key of LEGACY_KEYS) localStorage.removeItem(key);
}

export function logout() {
  clearSession();
}
