const assert = require('node:assert/strict');
const test = require('node:test');
const { readFileSync } = require('node:fs');
const { AnalyticsRollupJob } = require('../dist/src/analytics/jobs/analytics-rollup.job.js');
const { MessagingWorker } = require('../dist/src/messaging/messaging.worker.js');
const { MessagingScheduler } = require('../dist/src/messaging/messaging.scheduler.js');
const { PrismaService } = require('../dist/src/prisma/prisma.service.js');

const deferred = () => { let resolve, reject; const promise = new Promise((ok, no) => { resolve = ok; reject = no; }); return { promise, resolve, reject }; };
const queue = { canProcess: () => true };

test('analytics scheduler creates one recursive timeout and contains no legacy interval', async () => {
  const source = readFileSync('src/analytics/jobs/analytics-rollup.job.ts', 'utf8');
  assert.doesNotMatch(source, /setInterval\s*\(/);
  const originalTimeout = global.setTimeout, originalClearTimeout = global.clearTimeout;
  const timers = [], cleared = [];
  global.setTimeout = (callback, delay) => (timers.push({ callback, delay }), timers.length);
  global.clearTimeout = id => cleared.push(id);
  try {
    const job = new AnalyticsRollupJob({ processEvent: async () => false });
    job.onModuleInit(); job.onModuleInit();
    assert.equal(timers.length, 1, 'initializing twice must create only one timer');
    job.onModuleDestroy();
    assert.deepEqual(cleared, [1]);
  } finally { global.setTimeout = originalTimeout; global.clearTimeout = originalClearTimeout; }
});

test('analytics rollup prevents overlap and releases its lock after success', async () => {
  const gate = deferred(); let calls = 0;
  const job = new AnalyticsRollupJob({ processEvent: async () => { calls++; await gate.promise; return false; } });
  const first = job.runOnce();
  assert.deepEqual(await job.runOnce(), { processed: 0, skipped: true });
  gate.resolve(); await first;
  await job.runOnce();
  assert.equal(calls, 2);
});

test('analytics lock is released after exception and P2028 gets bounded backoff without an aggressive loop', async () => {
  let calls = 0; const error = Object.assign(new Error('transaction unavailable'), { code: 'P2028' });
  const job = new AnalyticsRollupJob({ processEvent: async () => { calls++; if (calls === 1) throw error; return false; } });
  await assert.rejects(() => job.runOnce(100), error);
  assert.equal(calls, 1, 'a failure must stop the batch instead of retrying 100 times immediately');
  assert.equal(job.nextDelayMs(), 60_000);
  assert.deepEqual(await job.runOnce(), { processed: 0, skipped: false });
  assert.equal(job.nextDelayMs(), 60_000);
});

test('messaging worker prevents overlap and releases its lock', async () => {
  const gate = deferred(); let calls = 0;
  const worker = new MessagingWorker({ processNext: async () => { calls++; await gate.promise; return { id: 'one' }; } }, queue);
  const first = worker.processOne();
  assert.equal(await worker.processOne(), null);
  gate.resolve(); await first;
  await worker.processOne();
  assert.equal(calls, 2);
});

test('messaging worker backs off when idle and exponentially after database failures', async () => {
  const idle = new MessagingWorker({ processNext: async () => null }, queue);
  assert.equal(await idle.processOne(), null);
  assert.equal(idle.nextDelayMs(false), 15_000);
  const failing = new MessagingWorker({ processNext: async () => { throw Object.assign(new Error('pool'), { code: 'P2024' }); } }, queue);
  await failing.processOne(); assert.equal(failing.nextDelayMs(false), 15_000);
  await failing.processOne(); assert.equal(failing.nextDelayMs(false), 30_000);
});

test('messaging worker calls processNext once per cycle, releases after errors, and success resets backoff', async () => {
  let calls = 0, fail = true;
  const worker = new MessagingWorker({ processNext: async () => { calls++; if (fail) throw new Error('database unavailable'); return { id: 'ok' }; } }, queue);
  assert.equal(await worker.processOne(), null);
  assert.equal(calls, 1);
  assert.equal(worker.nextDelayMs(false), 15_000);
  assert.equal(await worker.processOne(), null, 'the error path must release running for another cycle');
  assert.equal(calls, 2);
  assert.equal(worker.nextDelayMs(false), 30_000);
  fail = false;
  assert.deepEqual(await worker.processOne(), { id: 'ok' });
  assert.equal(calls, 3);
  assert.equal(worker.nextDelayMs(true), 1_000, 'success must reset consecutive failures');
  await worker.processOne();
  assert.equal(calls, 4, 'the success path must also release running');
});

test('scheduler module initialization is idempotent and destroy clears both timers', () => {
  const originalTimeout = global.setTimeout, originalInterval = global.setInterval;
  const originalClearTimeout = global.clearTimeout, originalClearInterval = global.clearInterval;
  const timers = [], cleared = [];
  global.setTimeout = (callback, delay) => (timers.push({ callback, delay, kind: 'timeout' }), timers.length);
  global.setInterval = (callback, delay) => (timers.push({ callback, delay, kind: 'interval' }), timers.length);
  global.clearTimeout = id => cleared.push(id); global.clearInterval = id => cleared.push(id);
  try {
    const scheduler = new MessagingScheduler({ processOne: async () => null, nextDelayMs: () => 15_000 }, { reconcileOperational: async () => {} });
    scheduler.onModuleInit(); scheduler.onModuleInit();
    assert.equal(timers.length, 2);
    scheduler.onModuleDestroy();
    assert.equal(cleared.length, 2);
  } finally { global.setTimeout = originalTimeout; global.setInterval = originalInterval; global.clearTimeout = originalClearTimeout; global.clearInterval = originalClearInterval; }
});

test('scheduler uses no worker interval and destroy prevents a completed cycle from rescheduling', async () => {
  const source = readFileSync('src/messaging/messaging.scheduler.ts', 'utf8');
  assert.doesNotMatch(source, /setInterval\s*\(\s*\(\)\s*=>\s*void this\.worker\.processOne/);
  const originalTimeout = global.setTimeout, originalInterval = global.setInterval;
  const originalClearTimeout = global.clearTimeout, originalClearInterval = global.clearInterval;
  const timers = [];
  global.setTimeout = (callback, delay) => (timers.push({ callback, delay, kind: 'worker' }), timers.length);
  global.setInterval = (callback, delay) => (timers.push({ callback, delay, kind: 'reconcile' }), timers.length);
  global.clearTimeout = () => {}; global.clearInterval = () => {};
  try {
    const gate = deferred();
    const scheduler = new MessagingScheduler({ processOne: () => gate.promise, nextDelayMs: () => 15_000 }, { reconcileOperational: async () => {} });
    scheduler.onModuleInit();
    const workerTimer = timers.find(timer => timer.kind === 'worker');
    const runningCycle = workerTimer.callback();
    scheduler.onModuleDestroy();
    gate.resolve(null); await runningCycle;
    assert.equal(timers.filter(timer => timer.kind === 'worker').length, 1, 'destroyed scheduler must not enqueue another worker timeout');
    assert.equal(timers.filter(timer => timer.kind === 'reconcile').length, 1, 'reconciliation remains an independent interval');
  } finally { global.setTimeout = originalTimeout; global.setInterval = originalInterval; global.clearTimeout = originalClearTimeout; global.clearInterval = originalClearInterval; }
});

test('Prisma lifecycle connects and disconnects, with one globally provided runtime client', async () => {
  const service = Object.create(PrismaService.prototype); let connected = 0, disconnected = 0;
  service.$connect = async () => connected++; service.$disconnect = async () => disconnected++;
  await service.onModuleInit(); await service.onModuleDestroy();
  assert.deepEqual({ connected, disconnected }, { connected: 1, disconnected: 1 });
  assert.match(readFileSync('src/main.ts', 'utf8'), /enableShutdownHooks\(\)/);
  const moduleSource = readFileSync('src/prisma/prisma.module.ts', 'utf8');
  assert.match(moduleSource, /@Global\(\)/); assert.equal((moduleSource.match(/providers: \[PrismaService\]/g) || []).length, 1);
});

test('no runtime PrismaClient is constructed outside PrismaService', () => {
  const files = require('node:child_process').execFileSync('bash', ['-lc', "rg -l 'new PrismaClient\\(' src || true"], { encoding: 'utf8' }).trim();
  assert.equal(files, '');
  assert.match(readFileSync('src/prisma/prisma.service.ts', 'utf8'), /extends PrismaClient/);
});

test('Meta calls are outside Prisma transactions and queue claim remains atomic and duplicate-safe', () => {
  const service = readFileSync('src/messaging/messaging.service.ts', 'utf8');
  const processNext = service.slice(service.indexOf('async processNext()'), service.indexOf('private async sendQueue'));
  assert.doesNotMatch(processNext, /\$transaction/);
  assert.match(processNext, /updateMany\(\{ where: \{ id: next\.id, status:/);
  assert.match(processNext, /if \(!claimed\.count\) return null/);
  assert.match(processNext, /externalMessageId:null/);
});

test('queue schema enforces one message per campaign recipient and failure path keeps a terminal/retry status', () => {
  const schema = readFileSync('prisma/schema.prisma', 'utf8');
  const model = schema.match(/model MessageQueue \{[\s\S]*?\n\}/)[0];
  assert.match(model, /@@unique\(\[campaignId, recipientId\]\)/);
  const service = readFileSync('src/messaging/messaging.service.ts', 'utf8');
  assert.match(service, /markFailure\(queue\.id/);
  assert.match(service, /FAILED_RETRYABLE|FAILED_PERMANENT/);
});
