const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
test('Meta Embedded Signup replaces manual access-token routes', () => {
  const controller=readFileSync('src/whatsapp/whatsapp.controller.ts','utf8');
  const signup=readFileSync('src/whatsapp/meta/meta-embedded-signup.service.ts','utf8');
  const ui=readFileSync('../app/whatsapp/page.tsx','utf8');
  assert.match(controller,/embedded-signup\/config/); assert.match(controller,/embedded-signup\/complete/);
  assert.doesNotMatch(controller,/@Post\('accounts'\)/); assert.match(signup,/exchangeCode/); assert.match(signup,/discoverEmbeddedAssets/);
  assert.match(ui,/Conectar com Meta/); assert.match(ui,/Reconectar/); assert.match(ui,/Atualizar permissões/); assert.doesNotMatch(ui,/type="password"|Access token/i);
});
test('credentials are encrypted and expiry renewal is enforced',()=>{
  const schema=readFileSync('prisma/schema.prisma','utf8'); const service=readFileSync('src/whatsapp/whatsapp.service.ts','utf8'); const signup=readFileSync('src/whatsapp/meta/meta-embedded-signup.service.ts','utf8');
  for(const field of ['credentialType','tokenExpiresAt','tokenLastRenewedAt','grantedScopes']) assert.match(schema,new RegExp(field));
  assert.match(signup,/crypto\.encrypt\(token\)/); assert.match(service,/validAccessToken/); assert.match(service,/TOKEN_EXPIRED/); assert.match(service,/renewToken/);
});
