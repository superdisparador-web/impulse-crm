const REQUIRED_JWT_ENV_VARS = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const;

type JwtEnvironment = Partial<Record<(typeof REQUIRED_JWT_ENV_VARS)[number], string>>;

export function getJwtAccessSecret(env: JwtEnvironment = process.env): string {
  const missing = REQUIRED_JWT_ENV_VARS.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Configuração JWT inválida. Variáveis de ambiente ausentes: ${missing.join(', ')}`,
    );
  }

  return env.JWT_ACCESS_SECRET as string;
}
