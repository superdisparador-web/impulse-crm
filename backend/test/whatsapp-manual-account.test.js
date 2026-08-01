const assert = require('node:assert/strict');
const { beforeEach, test } = require('node:test');
const { BadRequestException, ForbiddenException } = require('@nestjs/common');
const { WhatsappService } = require('../dist/src/whatsapp/whatsapp.service');
const { WhatsappCredentialCryptoService } = require('../dist/src/whatsapp/security/credential-crypto.service');

const token = 'EAAB-' + 'secret-token-'.repeat(4);
const baseDto = { organizationId: 'org-1', name: 'Atendimento', phoneNumberId: 'phone-1', wabaId: 'waba-1', businessAccountId: 'business-1', accessToken: token, apiVersion: 'v23.0' };

function fixture({ role = 'GLOBAL_ADMIN', existing = null, count = 0, createError, metaError, serializeTransactions = false } = {}) {
  const events = [], auditEvents = [];
  const rows = existing ? [existing] : [];
  const account = {
    findFirst: async ({ where }) => {
      events.push('find');
      const ors = where.OR || [];
      return rows.find(row => ors.some(condition => Object.entries(condition).every(([key, value]) => row[key] === value))) || null;
    },
    count: async () => count + rows.length,
    updateMany: async () => ({ count: 1 }),
    create: async ({ data, select }) => {
      events.push('create');
      if (createError) throw createError;
      const safe = { id: 'account-1', organizationId: data.organizationId, name: data.name, phoneNumberId: data.phoneNumberId, wabaId: data.wabaId, isDefault: data.isDefault, tokenConfigured: true, tokenLast4: data.tokenLast4 };
      rows.push({ ...data, ...safe });
      assert.equal(select.accessToken, undefined);
      return safe;
    },
  };
  let transactionTail = Promise.resolve();
  const prisma = {
    organization: { findFirst: async () => ({ id: 'org-1' }) },
    whatsappAccount: account,
    $executeRaw: async () => 1,
    $transaction: async callback => {
      if (!serializeTransactions) return callback(prisma);
      const previous = transactionTail;
      let release;
      transactionTail = new Promise(resolve => { release = resolve; });
      await previous;
      try { return await callback(prisma); } finally { release(); }
    },
  };
  const access = { resolve: async user => ({ id: user.id, roles: [role], organizationId: role === 'GLOBAL_ADMIN' ? null : 'org-1', global: role === 'GLOBAL_ADMIN' }) };
  const meta = { testConnection: async input => { events.push('meta'); if (metaError) throw metaError; assert.equal(input.accessToken, token); return { ok: true, phoneNumberId: input.phoneNumberId, wabaId: input.wabaId, displayPhoneNumber: '+55 11 99999-9999', verifiedName: 'Impulse', qualityRating: 'GREEN' }; } };
  process.env.META_TOKEN_ENCRYPTION_KEY = 'test-encryption-key-with-at-least-32-characters';
  const crypto = new WhatsappCredentialCryptoService();
  const service = new WhatsappService(prisma, access, { record: async entry => auditEvents.push(entry) }, crypto, meta, {});
  return { service, events, rows, auditEvents };
}

beforeEach(() => { process.env.META_TOKEN_ENCRYPTION_KEY = 'test-encryption-key-with-at-least-32-characters'; });

test('GLOBAL_ADMIN valida na Meta antes de persistir e recebe resposta sem segredos', async () => {
  const f = fixture();
  const result = await f.service.createManualAccount(baseDto, { id: 'global' });
  assert.ok(f.events.indexOf('meta') < f.events.indexOf('create'));
  assert.equal(result.id, 'account-1');
  assert.equal(JSON.stringify(result).includes(token), false);
  assert.equal('accessToken' in result, false);
  assert.equal(f.auditEvents.length, 1);
});

for (const role of ['ORG_ADMIN', 'BROKER']) test(`${role} recebe 403 sem chamar Meta nem persistir`, async () => {
  const f = fixture({ role });
  await assert.rejects(f.service.createManualAccount(baseDto, { id: role }), error => error instanceof ForbiddenException && error.getStatus() === 403);
  assert.deepEqual(f.events, []);
});

test('access token e verify token são criptografados e primeira conta é padrão', async () => {
  const f = fixture();
  const result = await f.service.createManualAccount(baseDto, { id: 'global' });
  const stored = f.rows[0];
  assert.match(stored.accessToken, /^enc:v1:/);
  assert.match(stored.verifyToken, /^enc:v1:/);
  assert.notEqual(stored.accessToken, token);
  assert.equal(stored.verifyTokenHash.length, 64);
  assert.equal(stored.tokenLast4, token.slice(-4));
  assert.equal(result.isDefault, true);
});

test('falha de persistência executa rollback lógico e não audita', async () => {
  const failure = new Error('database unavailable');
  const f = fixture({ createError: failure });
  await assert.rejects(f.service.createManualAccount(baseDto, { id: 'global' }), failure);
  assert.equal(f.rows.length, 0);
  assert.equal(f.auditEvents.length, 0);
});

test('rejeita Phone Number ID e WABA duplicados na mesma organização', async () => {
  for (const existing of [{ organizationId: 'org-1', phoneNumberId: 'phone-1', wabaId: 'other' }, { organizationId: 'org-1', phoneNumberId: 'other', wabaId: 'waba-1' }]) {
    const f = fixture({ existing });
    await assert.rejects(f.service.createManualAccount(baseDto, { id: 'global' }), error => error instanceof BadRequestException && error.message === 'WHATSAPP_ACCOUNT_DUPLICATE_PHONE');
  }
});

test('não permite vincular identificadores pertencentes a outra organização', async () => {
  const f = fixture({ existing: { organizationId: 'org-2', phoneNumberId: 'phone-1', wabaId: 'other' } });
  await assert.rejects(f.service.createManualAccount(baseDto, { id: 'global' }), error => error instanceof BadRequestException && error.message === 'WHATSAPP_ACCOUNT_ALREADY_LINKED');
  assert.equal(f.rows.length, 1);
});

test('requisições concorrentes para a mesma conta persistem somente uma vez', async () => {
  const f = fixture({ serializeTransactions: true });
  const results = await Promise.allSettled([
    f.service.createManualAccount(baseDto, { id: 'global-1' }),
    f.service.createManualAccount(baseDto, { id: 'global-2' }),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter(result => result.status === 'rejected' && result.reason instanceof BadRequestException).length, 1);
  assert.equal(f.rows.length, 1);
});

test('erro Meta remove o token da resposta e nenhum segredo é escrito em console', async () => {
  const messages = [];
  const original = console.error;
  console.error = (...args) => messages.push(args.join(' '));
  try {
    const f = fixture({ metaError: new Error(`Meta rejected access_token=${token}; Bearer ${token}`) });
    await assert.rejects(f.service.createManualAccount(baseDto, { id: 'global' }), error => {
      const body = JSON.stringify(error.getResponse());
      return !body.includes(token) && body.includes('[REDACTED]');
    });
    assert.equal(messages.join(' ').includes(token), false);
    assert.equal(f.rows.length, 0);
  } finally { console.error = original; }
});
