const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";

interface RequestOptions extends RequestInit {
  body?: any;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      message || `Erro ${response.status} ao acessar a API.`
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) =>
    request<T>(endpoint),

  post: <T>(endpoint: string, body: any) =>
    request<T>(endpoint, {
      method: "POST",
      body,
    }),

  put: <T>(endpoint: string, body: any) =>
    request<T>(endpoint, {
      method: "PUT",
      body,
    }),

  patch: <T>(endpoint: string, body: any) =>
    request<T>(endpoint, {
      method: "PATCH",
      body,
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, {
      method: "DELETE",
    }),
};