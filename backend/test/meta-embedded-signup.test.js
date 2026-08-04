const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { BadRequestException, UnauthorizedException } = require('@nestjs/common');
const { MetaEmbeddedSignupService } = require('../dist/src/whatsapp/meta/meta-embedded-signup.service');

function embeddedHarness(organizationId = 'org-1') {
  const stored = [];
  const prisma = {
    whatsappAccount: {
      findFirst: async () => null,
      findUnique: async () => null,
      upsert: async ({ create, update }) => { stored.push({ create, update }); return { id: 'account-1', ...create }; },
    },
    whatsappTemplate: { upsert: async () => ({}) },
  };
  const access = { resolve: async user => ({ id: user.id, organizationId, global: false }) };
  const crypto = { encrypt: value => `encrypted:${value}` };
  const meta = {
    exchangeCode: async () => ({ accessToken: 'short-token', expiresAt: new Date(Date.now() + 60_000) }),
    renewToken: async () => ({ accessToken: 'long-token', expiresAt: new Date(Date.now() + 120_000) }),
    inspectToken: async () => ({ valid: true, type: 'SYSTEM_USER', scopes: ['whatsapp_business_management'] }),
    discoverEmbeddedAssets: async () => [{ phoneNumberId: 'phone-1', displayPhoneNumber: '+5511999999999', verifiedName: 'Impulse', qualityRating: 'GREEN', wabaId: 'waba-1', wabaName: 'Impulse WABA' }],
    syncTemplates: async () => [],
  };
  return { service: new MetaEmbeddedSignupService(prisma, access, crypto, meta), stored };
}

function withMetaEnv(fn) {
  const previous = { ...process.env };
  Object.assign(process.env, { META_APP_ID: 'app-1', META_APP_SECRET: 'secret-1', META_EMBEDDED_SIGNUP_CONFIG_ID: 'config-1', META_GRAPH_API_VERSION: 'v20.0', FRONTEND_URL: 'https://crm.example.test' });
  return Promise.resolve().then(fn).finally(() => { process.env = previous; });
}
test('Meta Embedded Signup replaces manual access-token routes', () => {
  const controller=readFileSync('src/whatsapp/whatsapp.controller.ts','utf8');
  const signup=readFileSync('src/whatsapp/meta/meta-embedded-signup.service.ts','utf8');
  const page=readFileSync('../app/whatsapp/page.tsx','utf8'); const ui=readFileSync('../components/connections/ConnectionsEnterprise.tsx','utf8');
  assert.match(controller,/embedded-signup\/config/); assert.match(controller,/embedded-signup\/complete/);
  assert.doesNotMatch(controller,/@Post\('accounts'\)/); assert.match(signup,/exchangeCode/); assert.match(signup,/discoverEmbeddedAssets/);
  assert.match(page,/startEmbeddedSignup/); assert.match(ui,/Conectar WhatsApp Oficial/); assert.match(ui,/Adicionar outra conta/); assert.match(ui,/Atualizar credencial/); assert.doesNotMatch(ui,/type="password"/); assert.match(ui,/access token[^.]*nunca são exibidos/i);
});
test('credentials are encrypted and expiry renewal is enforced',()=>{
  const schema=readFileSync('prisma/schema.prisma','utf8'); const service=readFileSync('src/whatsapp/whatsapp.service.ts','utf8'); const signup=readFileSync('src/whatsapp/meta/meta-embedded-signup.service.ts','utf8');
  for(const field of ['credentialType','tokenExpiresAt','tokenLastRenewedAt','grantedScopes']) assert.match(schema,new RegExp(field));
  assert.match(signup,/crypto\.encrypt\(token\)/); assert.match(service,/validAccessToken/); assert.match(service,/TOKEN_EXPIRED/); assert.match(service,/renewToken/);
});

test('creates an authenticated signed Meta session bound to the configured frontend origin', () => withMetaEnv(async () => {
  const { service } = embeddedHarness();
  const session = await service.createSession({ returnUrl: 'https://crm.example.test/whatsapp' }, { id: 'user-1' });
  const url = new URL(session.authorizationUrl);
  assert.equal(url.origin, 'https://www.facebook.com');
  assert.equal(url.searchParams.get('client_id'), 'app-1');
  assert.equal(url.searchParams.get('config_id'), 'config-1');
  assert.ok(url.searchParams.get('state'));
  assert.ok(new Date(session.expiresAt).getTime() > Date.now());
}));

test('rejects an invalid returnUrl origin to prevent open redirects', () => withMetaEnv(async () => {
  const { service } = embeddedHarness();
  await assert.rejects(() => service.createSession({ returnUrl: 'https://attacker.example/steal' }, { id: 'user-1' }), BadRequestException);
}));

test('rejects invalid, expired and organization-mismatched OAuth state', () => withMetaEnv(async () => {
  const { service } = embeddedHarness('org-2');
  await assert.rejects(() => service.complete({ code: 'code', state: 'invalid.state' }, { id: 'user-1' }), UnauthorizedException);
  const expired = service.encode({ organizationId: 'org-2', userId: 'user-1', nonce: 'n', exp: Date.now() - 1 }, 'secret-1');
  await assert.rejects(() => service.complete({ code: 'code', state: expired }, { id: 'user-1' }), /META_OAUTH_STATE_EXPIRED/);
  const wrongOrganization = service.encode({ organizationId: 'org-1', userId: 'user-1', nonce: 'n', exp: Date.now() + 60_000 }, 'secret-1');
  await assert.rejects(() => service.complete({ code: 'code', state: wrongOrganization }, { id: 'user-1' }), /META_OAUTH_STATE_MISMATCH/);
}));

test('completes OAuth callback and persists only encrypted credentials in the authenticated organization', () => withMetaEnv(async () => {
  const { service, stored } = embeddedHarness();
  const state = service.encode({ organizationId: 'org-1', userId: 'user-1', nonce: 'n', exp: Date.now() + 60_000 }, 'secret-1');
  const result = await service.complete({ code: 'valid-code', state }, { id: 'user-1' });
  assert.equal(result.accountsConnected, 1);
  assert.equal(stored[0].create.organizationId, 'org-1');
  assert.equal(stored[0].create.accessToken, 'encrypted:long-token');
  assert.equal(stored[0].create.credentialType, 'SYSTEM_USER');
  assert.doesNotMatch(JSON.stringify(stored[0]), /short-token/);
}));
