import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const source = readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  module._compile(output.outputText, filename);
};

function browserSession() {
  const values = new Map([['token', 'expired-access'], ['refreshToken', 'valid-refresh'], ['user', '{}']]);
  global.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  const redirects = [];
  global.window = { location: { pathname: '/dashboard', assign: (url) => redirects.push(url) } };
  return { values, redirects };
}

function loadApi() {
  for (const path of [require.resolve('../services/api.ts'), require.resolve('../services/session.ts')]) delete require.cache[path];
  return require('../services/api.ts').api;
}

test('a single refresh renews tokens and retries every concurrent 401 request', async () => {
  const { values } = browserSession();
  let refreshCalls = 0;
  const protectedCalls = new Map();
  global.fetch = async (url, options = {}) => {
    if (String(url).endsWith('/auth/refresh')) {
      refreshCalls += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      assert.deepEqual(JSON.parse(options.body), { refreshToken: 'valid-refresh' });
      return { ok: true, status: 200, json: async () => ({ accessToken: 'new-access', refreshToken: 'new-refresh' }) };
    }
    const count = (protectedCalls.get(url) ?? 0) + 1;
    protectedCalls.set(url, count);
    if (count === 1) return { ok: false, status: String(url).endsWith('/users') ? 419 : 401, text: async () => 'Unauthorized' };
    assert.equal(new Headers(options.headers).get('Authorization'), 'Bearer new-access');
    return { ok: true, status: 200, json: async () => ({ url }) };
  };

  const api = loadApi();
  await Promise.all([api('/dashboard'), api('/users')]);

  assert.equal(refreshCalls, 1);
  assert.equal(values.get('token'), 'new-access');
  assert.equal(values.get('refreshToken'), 'new-refresh');
});

test('failed refresh clears the session and redirects without retrying refresh', async () => {
  const { values, redirects } = browserSession();
  let refreshCalls = 0;
  global.fetch = async (url) => {
    if (String(url).endsWith('/auth/refresh')) {
      refreshCalls += 1;
      return { ok: false, status: 401, text: async () => 'Unauthorized' };
    }
    return { ok: false, status: 401, text: async () => 'Unauthorized' };
  };

  const api = loadApi();
  await assert.rejects(api('/dashboard'), { message: 'Sua sessão expirou. Faça login novamente.' });

  assert.equal(refreshCalls, 1);
  assert.equal(values.has('token'), false);
  assert.equal(values.has('refreshToken'), false);
  assert.deepEqual(redirects, ['/login?session=expired']);
});
