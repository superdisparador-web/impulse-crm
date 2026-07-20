import { api } from "./api";

export interface LoginResponse {
  access_token: string;
}

export async function login(email: string, password: string) {
  const response = await api<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  localStorage.setItem("token", response.access_token);

  return response;
}

export function logout() {
  localStorage.removeItem("token");
}

export function getToken() {
  return localStorage.getItem("token");
}

export function isAuthenticated() {
  return !!getToken();
}