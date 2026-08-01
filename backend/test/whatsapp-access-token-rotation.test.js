const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const { BadRequestException, ForbiddenException, NotFoundException } = require('@nestjs/common');
const { WhatsappService } = require('../dist/src/whatsapp/whatsapp.service');
const { WhatsappCredentialCryptoService } = require('../dist/src/whatsapp/security/credential-crypto.service');

const oldToken = 'EAAB-' + 'old-secret-'.repeat(4);
const newToken = 'EAAB-' + 'new-secret-'.repeat(4);

function fixture({ roles = ['GLOBAL_ADMIN'], account, metaError } = {}) {
  const events = [], audits = [];
  const crypto = new WhatsappCredentialCryptoService();
  const row = account === null ? null : { id: 'account-1', organizationId: 'org-1', provider: 'META_CLOUD', wabaId: 'waba-1', phoneNumberId: 'phone-1', businessAccountId: 'business-1', apiVersion: 'v23.0', accessToken: crypto.encrypt(oldToken), tokenConfigured: true, tokenLast4: oldToken.slice(-4), status: 'ERROR', connectedAt: null, phoneNumber: '+5511999999999', normalizedPhone: '+5511999999999', ...account };
  const prisma = { whatsappAccount: {
    findFirst: async ({ where }) => { events.push(['find', where]); return row && where.id === row.id ? row : null; },
    update: async ({ data, select }) => { events.push(['update', data]); Object.assign(row, data); assert.equal(select.accessToken, undefined); return Object.fromEntries(Object.keys(select).map(key => [key, row[key]])); },
  }};
  const access = { resolve: async user => ({ id: user.id, roles, global: roles.includes('GLOBAL_ADMIN'), organizationId: roles.includes('GLOBAL_ADMIN') ? null : 'org-2' }) };
  const meta = { testConnection: async input => { events.push(['meta', input]); if (metaError) throw metaError; return { displayPhoneNumber: '+55 11 98888-7777', verifiedName: 'Impulse', qualityRating: 'GREEN' }; } };
  const service = new WhatsappService(prisma, access, { record: async value => audits.push(value) }, crypto, meta, {});
  return { service, row, events, audits, crypto };
}

beforeEach(() => { process.env.META_TOKEN_ENCRYPTION_KEY = 'test-encryption-key-with-at-least-32-characters'; });

test('GLOBAL_ADMIN valida antes de criptografar e substituir, limpa erro e retorna somente dados seguros', async () => {
  const f = fixture();
  const result = await f.service.updateAccessToken('account-1', { accessToken: newToken }, { id: 'global' });
  assert.deepEqual(f.events.map(event => event[0]), ['find', 'meta', 'update']);
  const input = f.events[1][1];
  assert.deepEqual(input, { accessToken: newToken, wabaId: 'waba-1', phoneNumberId: 'phone-1', businessAccountId: 'business-1', apiVersion: 'v23.0' });
  assert.match(f.row.accessToken, /^enc:v1:/);
  assert.equal(f.crypto.decrypt(f.row.accessToken), newToken);
  assert.equal(f.row.tokenLast4, newToken.slice(-4));
  assert.equal(f.row.tokenConfigured, true);
  assert.equal(f.row.status, 'ACTIVE');
  assert.equal(f.row.lastConnectionError, null);
  assert.equal('accessToken' in result, false);
  assert.equal(JSON.stringify(result).includes(newToken), false);
  assert.equal(JSON.stringify(f.audits).includes(newToken), false);
});

for (const roles of [['ORG_ADMIN'], ['BROKER']]) test(`${roles[0]} recebe 403 antes de consultar a conta`, async () => {
  const f = fixture({ roles });
  await assert.rejects(f.service.updateAccessToken('account-1', { accessToken: newToken }, { id: 'user' }), error => error instanceof ForbiddenException && error.message === 'WHATSAPP_ACCESS_TOKEN_GLOBAL_ADMIN_ONLY');
  assert.deepEqual(f.events, []);
});

test('conta inexistente é rejeitada com código específico', async () => {
  const f = fixture({ account: null });
  await assert.rejects(f.service.updateAccessToken('missing', { accessToken: newToken }, { id: 'global' }), error => error instanceof NotFoundException && error.message === 'WHATSAPP_ACCOUNT_NOT_FOUND');
});

test('provider diferente de META_CLOUD é rejeitado sem validar ou persistir', async () => {
  const f = fixture({ account: { provider: 'EVOLUTION' } });
  await assert.rejects(f.service.updateAccessToken('account-1', { accessToken: newToken }, { id: 'global' }), error => error instanceof BadRequestException && error.message === 'WHATSAPP_ACCOUNT_PROVIDER_INVALID');
  assert.deepEqual(f.events.map(event => event[0]), ['find']);
});

for (const code of ['WHATSAPP_INVALID_ACCESS_TOKEN', 'WHATSAPP_INSUFFICIENT_PERMISSION', 'WHATSAPP_PHONE_NOT_FOUND_IN_WABA']) test(`${code} preserva o token anterior e o código`, async () => {
  const error = Object.assign(new Error(`${code}: Bearer ${newToken}`), { code });
  const f = fixture({ metaError: error });
  await assert.rejects(f.service.updateAccessToken('account-1', { accessToken: newToken }, { id: 'global' }), failure => {
    const response = JSON.stringify(failure.getResponse());
    return response.includes(code) && !response.includes(newToken);
  });
  assert.equal(f.crypto.decrypt(f.row.accessToken), oldToken);
  assert.deepEqual(f.events.map(event => event[0]), ['find', 'meta']);
});
