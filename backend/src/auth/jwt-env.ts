const REQUIRED_JWT_ENV_VARS = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const;
type JwtEnvironment = Partial<Record<(typeof REQUIRED_JWT_ENV_VARS)[number], string>>;
function requireJwtEnv(env: JwtEnvironment, key: (typeof REQUIRED_JWT_ENV_VARS)[number]): string {
  const missing = REQUIRED_JWT_ENV_VARS.filter((name) => !env[name]);
  if (missing.length > 0) throw new Error(`Configuração JWT inválida. Variáveis de ambiente ausentes: ${missing.join(', ')}`);
  return env[key] as string;
}
export function getJwtAccessSecret(env: JwtEnvironment = process.env): string { return requireJwtEnv(env, 'JWT_ACCESS_SECRET'); }
export function getJwtRefreshSecret(env: JwtEnvironment = process.env): string { return requireJwtEnv(env, 'JWT_REFRESH_SECRET'); }
