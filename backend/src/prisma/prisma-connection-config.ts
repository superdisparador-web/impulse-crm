import { hostname } from 'node:os';

export type PrismaPoolConfiguration = {
  connectionLimit: number;
  poolTimeoutSeconds: number;
  connectTimeoutSeconds: number;
  applicationName: string;
};

const DEFAULTS: PrismaPoolConfiguration = {
  connectionLimit: 8,
  poolTimeoutSeconds: 20,
  connectTimeoutSeconds: 10,
  applicationName: 'impulse-crm-local',
};

function positiveInteger(value: string | undefined, fallback: number, maximum?: number): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return fallback;
  return maximum === undefined ? parsed : Math.min(parsed, maximum);
}

export function prismaPoolConfiguration(env: NodeJS.ProcessEnv = process.env): PrismaPoolConfiguration {
  return {
    connectionLimit: positiveInteger(env.PRISMA_CONNECTION_LIMIT, DEFAULTS.connectionLimit, 8),
    poolTimeoutSeconds: positiveInteger(env.PRISMA_POOL_TIMEOUT, DEFAULTS.poolTimeoutSeconds),
    connectTimeoutSeconds: positiveInteger(env.PRISMA_CONNECT_TIMEOUT, DEFAULTS.connectTimeoutSeconds),
    applicationName: env.PRISMA_APPLICATION_NAME?.trim() || DEFAULTS.applicationName,
  };
}

export function configuredDatabaseUrl(env: NodeJS.ProcessEnv = process.env): { url: string; pool: PrismaPoolConfiguration } {
  const source = env.DATABASE_URL;
  if (!source) throw new Error('DATABASE_URL is required');
  const url = new URL(source);
  const pool = prismaPoolConfiguration(env);
  const instance = env.INSTANCE_ID ?? env.HOSTNAME ?? `${hostname()}-${process.pid}`;
  const parameters: Record<string, string> = {
    connection_limit: String(pool.connectionLimit),
    pool_timeout: String(pool.poolTimeoutSeconds),
    connect_timeout: String(pool.connectTimeoutSeconds),
    application_name: `${pool.applicationName}:${instance}`,
  };
  for (const [name, value] of Object.entries(parameters)) {
    if (!url.searchParams.has(name)) url.searchParams.set(name, value);
  }
  return { url: url.toString(), pool };
}
