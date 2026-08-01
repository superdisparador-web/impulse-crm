const SECRET_KEYS = new Set(['accessToken', 'verifyToken', 'appSecret', 'webhookSecret', 'authorization', 'cookie', 'cookies', 'token']);
export function redactSecrets<T>(value: T): T { if (!value || typeof value !== 'object') return value; if (Array.isArray(value)) return value.map(redactSecrets) as T; const out: Record<string, unknown> = {}; for (const [k, v] of Object.entries(value)) out[k] = SECRET_KEYS.has(k) ? '[REDACTED]' : redactSecrets(v as never); return out as T; }
export function sanitizeError(error: unknown, secrets: string[] = []): string {
  const message = error instanceof Error ? error.message : String(error ?? 'Erro desconhecido');
  const withoutKnownSecrets = secrets.filter(Boolean).reduce((safe, secret) => safe.split(secret).join('[REDACTED]'), message);
  return withoutKnownSecrets
    .replace(/Bearer\s+[^\s,;]+/gi, 'Bearer [REDACTED]')
    .replace(/access_token=([^&\s]+)/gi, 'access_token=[REDACTED]')
    .slice(0, 500);
}
