import { api } from "./api";
import { UserRole } from "@/types/user";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string | null;
}

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

  localStorage.setItem("token", response.accessToken);
  localStorage.setItem("refreshToken", response.refreshToken);
  localStorage.setItem("user", JSON.stringify(response.user));

  return response;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function getCurrentUser(): AuthenticatedUser | null {
  if (typeof window === "undefined") return null;

  const value = localStorage.getItem("user");

  if (!value) return null;

  try {
    return JSON.parse(value) as AuthenticatedUser;
  } catch {
    logout();
    return null;
  }
}

export function isGlobalAdmin() {
  const user = getCurrentUser();

  return user?.role === "ADMIN" && !user.organizationId;
}

export function isAuthenticated() {
  return !!getToken();
}