const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { SerializedJob, prismaErrorCode } = require('../dist/src/jobs/serialized-job');
const { MessagingWorker } = require('../dist/src/messaging/messaging.worker');
const { MessagingScheduler } = require('../dist/src/messaging/messaging.scheduler');
const { AnalyticsRollupJob } = require('../dist/src/analytics/jobs/analytics-rollup.job');

const logger = { log() {} };
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };

test('serialized job collapses 100 simultaneous calls and releases its lock', async () => {
  const gate = deferred(); let calls = 0;
  const job = new SerializedJob('test', 10, logger, 1_000);
  const requests = Array.from({ length: 100 }, () => job.run(async () => { calls += 1; await gate.promise; return true; }));
  await new Promise(setImmediate); gate.resolve(); await Promise.all(requests);
  assert.equal(calls, 1);
  await job.run(async () => { calls += 1; });
  assert.equal(calls, 2);
});

for (const code of ['P2024', 'P2028', 'P1001']) test(`${code} applies progressive backoff`, async () => {
  const job = new SerializedJob('test', 10, logger, 1_000);
  await job.run(async () => { throw Object.assign(new Error('database unavailable'), { code }); });
  assert.equal(job.nextIntervalMs, 20);
  await job.run(async () => { throw Object.assign(new Error('database unavailable'), { code }); });
  assert.equal(job.nextIntervalMs, 40);
  assert.equal(prismaErrorCode({ cause: { code } }), code);
});

test('success restores normal interval after a database failure', async () => {
  const job = new SerializedJob('test', 10, logger);
  await job.run(async () => { throw Object.assign(new Error(), { code: 'P1001' }); });
  await job.run(async () => true);
  assert.equal(job.nextIntervalMs, 10);
});

test('MessagingWorker never overlaps, including 100 callers', async () => {
  const gate = deferred(); let calls = 0;
  const worker = new MessagingWorker({ processNext: async () => { calls += 1; await gate.promise; } }, { canProcess: () => true });
  const requests = Array.from({ length: 100 }, () => worker.processOne());
  await new Promise(setImmediate); gate.resolve(); await Promise.all(requests);
  assert.equal(calls, 1);
});

test('AnalyticsRollupJob never overlaps, including 100 callers', async () => {
  const gate = deferred(); let calls = 0;
  const repository = { processEvent: async () => { calls += 1; await gate.promise; return false; } };
  const prisma = { processIdentity: {}, logPoolSnapshot: async () => undefined };
  const job = new AnalyticsRollupJob(repository, prisma);
  const requests = Array.from({ length: 100 }, () => job.runOnce());
  await new Promise(setImmediate); gate.resolve(); await Promise.all(requests);
  assert.equal(calls, 1);
});

test('scheduler hot reload guard prevents duplicate timer and shutdown cancels it', () => {
  const worker = { processOne: async () => null, get nextIntervalMs() { return 5; } };
  const first = new MessagingScheduler(worker); const duplicate = new MessagingScheduler(worker);
  first.onModuleInit(); duplicate.onModuleInit();
  assert.ok(first.timer); assert.equal(duplicate.timer, undefined);
  first.onModuleDestroy(); duplicate.onModuleDestroy();
  assert.equal(first.timer, undefined);
});

test('Prisma wiring has one global provider and one client subclass', () => {
  const moduleSource = fs.readFileSync('src/prisma/prisma.module.ts', 'utf8');
  const files = require('node:child_process').execFileSync('rg', ['-l', 'new\\s+PrismaClient|extends\\s+PrismaClient', 'src', 'test', 'prisma'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  assert.deepEqual(files, ['src/prisma/prisma.service.ts']);
  assert.match(moduleSource, /@Global\(\)/);
  assert.equal((moduleSource.match(/providers: \[PrismaService\]/g) || []).length, 1);
});

test('dashboard uses a bounded Prisma batch instead of massive Promise.all', () => {
  const source = fs.readFileSync('src/dashboard/dashboard.service.ts', 'utf8');
  assert.doesNotMatch(source, /await Promise\.all\(/);
  assert.match(source, /await this\.prisma\.\$transaction\(\[/);
});

test('bulk audience queue creation does not hold an interactive transaction', () => {
  const source = fs.readFileSync('src/messaging/messaging.service.ts', 'utf8');
  const method = source.slice(source.indexOf('async enqueueRecipients'), source.indexOf('async findAll'));
  assert.doesNotMatch(method, /\$transaction/);
  assert.match(method, /createManyAndReturn/);
});
