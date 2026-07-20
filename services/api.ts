const API_URL = "http://localhost:3000";

export async function api<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

api.get = function get<T>(endpoint: string): Promise<T> {
  return api<T>(endpoint);
};

api.post = function post<T>(endpoint: string, data: unknown): Promise<T> {
  return api<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

api.put = function put<T>(endpoint: string, data: unknown): Promise<T> {
  return api<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

api.delete = function remove<T>(endpoint: string): Promise<T> {
  return api<T>(endpoint, {
    method: "DELETE",
  });
};
