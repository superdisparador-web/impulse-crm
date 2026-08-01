const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const { MetaWhatsappHttpClient } = require('../dist/src/whatsapp/meta/meta-whatsapp-http.client');

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function input() {
  return { accessToken: 'secret-token-never-log', businessAccountId: '180280369759375', wabaId: '1043524394923078', phoneNumberId: '1188722550997573', apiVersion: 'v20.0' };
}

test('conexão válida lista números da WABA e sincroniza os campos oficiais sem consultar as contas do Business', async () => {
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url: String(url), authorization: init.headers.authorization });
    return response({ data: [{ id: input().phoneNumberId, verified_name: 'Impulse', display_phone_number: '+55 11 99999-9999', quality_rating: 'GREEN' }] });
  };
  const result = await new MetaWhatsappHttpClient({}).syncAccount(input());
  assert.deepEqual(result, { ok: true, phoneNumberId: input().phoneNumberId, wabaId: input().wabaId, verifiedName: 'Impulse', displayPhoneNumber: '+55 11 99999-9999', qualityRating: 'GREEN' });
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/1043524394923078\/phone_numbers\?fields=id%2Cverified_name%2Cdisplay_phone_number%2Cquality_rating&limit=100$/);
  assert.equal(calls[0].url.includes('owned_whatsapp_business_accounts'), false);
  assert.equal(calls.every(call => !call.url.includes('secret-token-never-log')), true);
});

test('número ausente na WABA produz erro específico', async () => {
  global.fetch = async () => response({ data: [{ id: 'outro' }] });
  await assert.rejects(new MetaWhatsappHttpClient({}).testConnection(input()), error => error.code === 'WHATSAPP_PHONE_NOT_FOUND_IN_WABA');
});

test('token inválido é classificado sem expor o token', async () => {
  global.fetch = async () => response({ error: { code: 190, type: 'OAuthException', message: 'Invalid OAuth access token.' } }, 401);
  await assert.rejects(new MetaWhatsappHttpClient({}).testConnection(input()), error => error.code === 'WHATSAPP_INVALID_ACCESS_TOKEN' && !error.message.includes(input().accessToken));
});

test('permissão insuficiente é classificada separadamente', async () => {
  global.fetch = async () => response({ error: { code: 10, type: 'OAuthException', message: 'Application does not have permission for this action' } }, 403);
  await assert.rejects(new MetaWhatsappHttpClient({}).testConnection(input()), error => error.code === 'WHATSAPP_INSUFFICIENT_PERMISSION');
});
