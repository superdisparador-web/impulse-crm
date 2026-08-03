const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { MODULE_METADATA } = require('@nestjs/common/constants');
const { AppModule } = require('../dist/src/app.module');
const { PipelineModule } = require('../dist/src/pipeline/pipeline.module');
const { LeadsModule } = require('../dist/src/leads/leads.module');
const { CampaignsModule } = require('../dist/src/campaigns/campaigns.module');
const { DistributionModule } = require('../dist/src/distribution/distribution.module');
const { AppLifecycleService } = require('../dist/src/app-lifecycle.service');
const { AnalyticsRollupJob } = require('../dist/src/analytics/jobs/analytics-rollup.job');
const { MessagingScheduler } = require('../dist/src/messaging/messaging.scheduler');
const { configuredDatabaseUrl, prismaPoolConfiguration } = require('../dist/src/prisma/prisma-connection-config');
const { PrismaService } = require('../dist/src/prisma/prisma.service');

test('bootstrap enables Nest shutdown hooks for SIGINT and SIGTERM', () => {
  const source = fs.readFileSync('src/main.ts', 'utf8');
  assert.match(source, /app\.enableShutdownHooks\(\['SIGINT', 'SIGTERM'\]\)/);
  assert.doesNotMatch(source, /process\.exit\(/);
  assert.match(source, /process\.exitCode = 1/);
});

test('pool URL uses conservative defaults without exposing credentials', () => {
  const source = 'postgresql://private-user:private-password@db.example.test:5432/app?schema=public';
  const configured = configuredDatabaseUrl({ DATABASE_URL: source, HOSTNAME: 'test-host' });
  const url = new URL(configured.url);
  assert.deepEqual(configured.pool, { connectionLimit: 8, poolTimeoutSeconds: 20, connectTimeoutSeconds: 10, applicationName: 'impulse-crm-local' });
  assert.equal(url.searchParams.get('connection_limit'), '8');
  assert.equal(url.searchParams.get('pool_timeout'), '20');
  assert.equal(url.searchParams.get('connect_timeout'), '10');
  assert.equal(url.searchParams.get('application_name'), 'impulse-crm-local:test-host');
  assert.doesNotMatch(JSON.stringify(configured.pool), /private-user|private-password|DATABASE_URL/);
});

test('pool values are overridable, existing URL parameters win, and pool never exceeds eight', () => {
  assert.deepEqual(prismaPoolConfiguration({ PRISMA_CONNECTION_LIMIT: '4', PRISMA_POOL_TIMEOUT: '7', PRISMA_CONNECT_TIMEOUT: '3', PRISMA_APPLICATION_NAME: 'custom' }), { connectionLimit: 4, poolTimeoutSeconds: 7, connectTimeoutSeconds: 3, applicationName: 'custom' });
  assert.equal(prismaPoolConfiguration({ PRISMA_CONNECTION_LIMIT: '99' }).connectionLimit, 8);
  const configured = configuredDatabaseUrl({ DATABASE_URL: 'postgresql://u:p@localhost/db?connection_limit=2&pool_timeout=5&connect_timeout=6&application_name=existing' });
  const url = new URL(configured.url);
  assert.equal(url.searchParams.get('connection_limit'), '2');
  assert.equal(url.searchParams.get('application_name'), 'existing');
});

test('Prisma disconnect is idempotent', async () => {
  const previous = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgresql://u:p@localhost:5432/db';
  try {
    const prisma = new PrismaService();
    let disconnects = 0;
    prisma.$disconnect = async () => { disconnects += 1; };
    await Promise.all([prisma.onModuleDestroy(), prisma.onModuleDestroy(), prisma.onModuleDestroy()]);
    assert.equal(disconnects, 1);
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previous;
  }
});

test('shutdown immediately prevents scheduler rescheduling', async () => {
  const lifecycle = new AppLifecycleService();
  let executions = 0;
  const worker = { processOne: async () => { executions += 1; }, get nextIntervalMs() { return 1; } };
  const scheduler = new MessagingScheduler(worker, lifecycle);
  scheduler.onModuleInit();
  lifecycle.beginShutdown();
  await new Promise(resolve => setTimeout(resolve, 15));
  assert.equal(executions, 0);
  assert.equal(scheduler.timer, undefined);
  scheduler.onModuleDestroy();
});

test('disabled Analytics creates no timer and executes no transaction', async () => {
  const previous = process.env.ANALYTICS_JOBS_ENABLED;
  process.env.ANALYTICS_JOBS_ENABLED = 'false';
  let transactions = 0;
  const job = new AnalyticsRollupJob({ processEvent: async () => { transactions += 1; return false; } }, { processIdentity: {}, logPoolSnapshot: async () => undefined });
  try {
    job.onModuleInit();
    await job.runOnce();
    await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(job.timer, undefined);
    assert.equal(transactions, 0);
  } finally {
    job.onModuleDestroy();
    if (previous === undefined) delete process.env.ANALYTICS_JOBS_ENABLED; else process.env.ANALYTICS_JOBS_ENABLED = previous;
  }
});

test('Pipeline routes are absent by default while operational modules remain loaded', () => {
  const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AppModule);
  assert.ok(!imports.includes(PipelineModule));
  assert.ok(imports.includes(LeadsModule));
  assert.ok(imports.includes(CampaignsModule));
  assert.ok(imports.includes(DistributionModule));
});

test('schema and migrations are untouched by the Phase 1 implementation', () => {
  const changed = require('node:child_process').execFileSync('git', ['diff', '--name-only'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  assert.ok(!changed.some(file => file === 'backend/prisma/schema.prisma' || file.startsWith('backend/prisma/migrations/')));
});
