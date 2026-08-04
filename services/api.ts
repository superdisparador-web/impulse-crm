import { clearSession, getAccessToken, getRefreshToken, updateTokens } from "./session";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const SESSION_EXPIRED_MESSAGE = "Sua sessão expirou. Faça login novamente.";

interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

let refreshPromise: Promise<string> | null = null;

function redirectToLogin(sessionExpired: boolean) {
  clearSession();
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign(sessionExpired ? "/login?session=expired" : "/login");
  }
}

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error(SESSION_EXPIRED_MESSAGE);

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) throw new Error(SESSION_EXPIRED_MESSAGE);

    const tokens = (await response.json()) as RefreshResponse;
    if (!tokens.accessToken) throw new Error(SESSION_EXPIRED_MESSAGE);
    updateTokens(tokens.accessToken, tokens.refreshToken);
    return tokens.accessToken;
  })().catch((error: unknown) => {
    redirectToLogin(true);
    throw error instanceof Error ? error : new Error(SESSION_EXPIRED_MESSAGE);
  }).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

function requestHeaders(options: RequestInit, token: string | null) {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

async function request(endpoint: string, options: RequestInit, token: string | null) {
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: requestHeaders(options, token),
  });
}

export function isAuthenticationError(response: Response) {
  if (response.status === 401 || response.status === 419 || response.status === 440) return true;
  return response.headers?.has("WWW-Authenticate") === true;
}

export async function api<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = getAccessToken();
  const hadAuthenticatedSession = Boolean(accessToken && getRefreshToken());
  let response = await request(endpoint, options, accessToken);
  const path = endpoint.split("?", 1)[0];
  const skipsRefresh = path === "/auth/login" || path === "/auth/register" || path === "/auth/refresh";

  if (isAuthenticationError(response) && !skipsRefresh) {
    if (!hadAuthenticatedSession) {
      redirectToLogin(false);
      throw new Error("Autenticação necessária.");
    }
    const renewedAccessToken = await refreshAccessToken();
    response = await request(endpoint, options, renewedAccessToken);

    if (isAuthenticationError(response)) {
      redirectToLogin(true);
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    let parsedError: { message?: string | string[]; error?: string } | null = null;
    try {
      parsedError = JSON.parse(errorText) as { message?: string | string[]; error?: string };
    } catch {
      parsedError = null;
    }
    const message = Array.isArray(parsedError?.message) ? parsedError.message.join(" ") : parsedError?.message;
    throw new Error(message || parsedError?.error || errorText);
  }

  return response.json();
}

api.blob = async function blob(endpoint: string): Promise<Blob> {
  const accessToken = getAccessToken();
  const hadAuthenticatedSession = Boolean(accessToken && getRefreshToken());
  let response = await request(endpoint, {}, accessToken);
  if (isAuthenticationError(response)) {
    if (!hadAuthenticatedSession) {
      redirectToLogin(false);
      throw new Error("Autenticação necessária.");
    }
    response = await request(endpoint, {}, await refreshAccessToken());
    if (isAuthenticationError(response)) {
      redirectToLogin(true);
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }
  }
  if (!response.ok) throw new Error("Não foi possível baixar o arquivo.");
  return response.blob();
};

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
