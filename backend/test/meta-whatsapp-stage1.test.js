const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { WhatsappCredentialCryptoService } = require('../dist/src/whatsapp/security/credential-crypto.service');
const { WhatsappService } = require('../dist/src/whatsapp/whatsapp.service');
const { createHmac } = require('node:crypto');
const schema = readFileSync('prisma/schema.prisma', 'utf8');
const service = readFileSync('src/whatsapp/whatsapp.service.ts', 'utf8');
const controller = readFileSync('src/whatsapp/whatsapp.controller.ts', 'utf8');
const dto = readFileSync('src/whatsapp/dto/create-whatsapp-account.dto.ts', 'utf8');

test('cadastro Meta Cloud persiste os identificadores necessários', () => {
  for (const value of ['provider', 'wabaId', 'phoneNumberId', 'businessAccountId']) assert.match(schema, new RegExp(`\\b${value}\\b`));
  assert.match(service, /provider: 'META_CLOUD'/);
});
test('queries de contas são isoladas por organização', () => {
  assert.match(service, /accountInOrg[\s\S]*organizationId: org/);
  assert.match(service, /WhatsappAccountWhereInput = \{ organizationId: org/);
});
test('API seleciona somente metadados mascarados do token', () => {
  const selection = service.match(/const selectAccount = \{([^;]+)\};/s)[1];
  assert.match(selection, /tokenConfigured: true/);
  assert.match(selection, /tokenLast4: true/);
  assert.doesNotMatch(selection, /accessToken: true|verifyToken: true/);
});
test('credenciais usam AES-GCM e não ficam em texto puro', () => {
  process.env.SECRETS_ENCRYPTION_KEY = 'test-key-with-more-than-thirty-two-characters';
  const crypto = new WhatsappCredentialCryptoService();
  const encrypted = crypto.encrypt('EAAB-example-secret-token');
  assert.notEqual(encrypted, 'EAAB-example-secret-token');
  assert.equal(crypto.decrypt(encrypted), 'EAAB-example-secret-token');
  assert.throws(() => crypto.decrypt('plaintext-secret'), /Credencial criptografada inválida/);
});
test('teste de conexão valida Phone Number ID e WABA ID retornados pela Meta', () => {
  assert.match(controller, /accounts\/:id\/test-connection/);
  assert.match(service, /r\.phoneNumberId !== a\.phoneNumberId/);
  assert.match(service, /r\.wabaId !== a\.wabaId/);
});
test('falha da Meta grava status e erro seguro', () => {
  assert.match(service, /WHATSAPP_META_CONNECTION_FAILED/);
  assert.match(service, /status: 'ERROR'/);
  assert.match(service, /sanitizeError\(e\)/);
});
test('validação do webhook compara token protegido', () => {
  assert.match(controller, /webhooks\/meta\/whatsapp/);
  assert.match(service, /safeSecretEquals\(this\.crypto\.decrypt\(found\.verifyToken\),verifyToken\)/);
});
test('verify token inválido é rejeitado', () => {
  assert.match(service, /UnauthorizedException\('WHATSAPP_WEBHOOK_VERIFY_TOKEN_INVALID'\)/);
});
test('webhook valida produto e registra payload sanitizado antes do async', () => {
  assert.match(service, /payload\?\.object!=='whatsapp_business_account'/);
  assert.match(service, /sanitizedPayload:redactSecrets/);
  assert.match(service, /setImmediate/);
});

test('assinatura X-Hub usa o corpo bruto, exige segredo e trata tamanhos diferentes', () => {
  const raw = Buffer.from('{"object":"whatsapp_business_account"}');
  const secret = 'meta-app-secret';
  const signature = `sha256=${createHmac('sha256', secret).update(raw).digest('hex')}`;
  const validator = WhatsappService.prototype.validateSignature;
  assert.doesNotThrow(() => validator.call({}, raw, signature, secret));
  assert.throws(() => validator.call({}, raw, 'sha256=abc', secret), /WHATSAPP_WEBHOOK_SIGNATURE_INVALID/);
  assert.throws(() => validator.call({}, raw, undefined, secret), /WHATSAPP_WEBHOOK_SIGNATURE_INVALID/);
  assert.throws(() => validator.call({}, raw, signature, undefined), /WHATSAPP_WEBHOOK_SIGNATURE_INVALID/);
});
test('webhook é idempotente e associa por WABA ou Phone Number ID', () => {
  assert.match(schema, /@@unique\(\[organizationId, whatsappAccountId, deduplicationKey\]\)/);
  assert.match(service, /webhookAccount\(phoneNumberId,entryWabaId\)/);
  assert.match(service, /accounts.length===1/);
  assert.match(schema, /wabaId\s+String\?/);
  assert.match(schema, /phoneNumberId\s+String\?/);
});
test('DTO rejeita IDs vazios e versões inválidas', () => {
  assert.match(dto, /IsNotEmpty\(\).*phoneNumberId/);
  assert.match(dto, /IsNotEmpty\(\).*wabaId/);
  assert.match(dto, /Matches\(\/\^v/);
});
