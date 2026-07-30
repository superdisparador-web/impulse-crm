const assert = require('node:assert/strict');
const { test, beforeEach, afterEach } = require('node:test');
const { EmbeddedSignupService } = require('../dist/src/whatsapp/embedded-signup/embedded-signup.service');

const env = { META_APP_ID:'app', META_APP_SECRET:'secret', META_CONFIG_ID:'config', META_REDIRECT_URI:'https://api.example.test/whatsapp/embedded-signup/callback', META_GRAPH_API_VERSION:'v23.0', META_TOKEN_ENCRYPTION_KEY:'x'.repeat(32), FRONTEND_URL:'https://crm.example.test' };
const oldFetch = global.fetch;
beforeEach(() => Object.assign(process.env, env));
afterEach(() => { global.fetch = oldFetch; });
function fixture(overrides={}) {
  let saved;
  const prisma = {
    whatsappEmbeddedSignupState: {
      create: async ({data}) => { saved=data; return data; },
      updateMany: async () => ({count:1}),
      findUnique: async () => ({organizationId:'org-1',userId:'user-1'}),
    },
    whatsappAccount: { findUnique: async () => null, upsert: async () => ({id:'account-1'}) },
    ...overrides,
  };
  prisma.$transaction = overrides.$transaction || (async callback => callback(prisma));
  const service = new EmbeddedSignupService(prisma, {resolve:async()=>({id:'user-1',organizationId:'org-1',global:false})}, {encrypt:v=>`encrypted:${v}`}, {syncTemplates:async()=>({})});
  return {service, getSaved:()=>saved, prisma};
}
test('rota cria state hasheado temporário e nunca responde segredo', async () => {
  const f=fixture(); const out=await f.service.createSession({id:'user-1'}); const state=new URL(out.authorizationUrl).searchParams.get('state');
  assert.ok(state && state.length >= 40); assert.equal(f.getSaved().stateHash.length,64); assert.equal(JSON.stringify(out).includes('secret'),false); assert.ok(new Date(out.expiresAt)-Date.now() <= 600000);
});
test('state inválido, expirado ou reutilizado é rejeitado antes da Meta', async () => {
  for (const count of [0]) { const f=fixture({whatsappEmbeddedSignupState:{updateMany:async()=>({count}),findUnique:async()=>null}}); assert.match(await f.service.complete({code:'code',state:'state'}),/reason=invalid_state/); }
});
test('callback sem code e cancelado retornam erros amigáveis', async () => {
  const f=fixture(); assert.match(await f.service.complete({state:'x'}),/reason=missing_code/); assert.match(await f.service.complete({error:'access_denied'}),/reason=cancelled/);
});
test('troca simulada cria conta criptografada, assina WABA e sincroniza templates', async () => {
  const f=fixture(); const calls=[];
  global.fetch=async (url,init={})=>{ calls.push({url:String(url),init}); const u=String(url); let body={}; if(u.includes('oauth/access_token'))body={access_token:'backend-only-token'}; else if(u.includes('/me/businesses'))body={data:[{id:'business-1'}]}; else if(u.includes('owned_whatsapp'))body={data:[{id:'waba-1',name:'Impulse'}]}; else if(u.includes('phone_numbers'))body={data:[{id:'phone-1',display_phone_number:'+55 11 99999-9999'}]}; return {ok:true,status:200,json:async()=>body}; };
  const result=await f.service.complete({code:'one-time-code',state:'valid-state'});
  assert.match(result,/connection=success/); assert.ok(calls.some(c=>c.url.includes('subscribed_apps'))); assert.equal(calls.some(c=>c.url.includes('backend-only-token')),false);
});
test('isolamento impede atualizar número pertencente a outra organização', async () => {
  const f=fixture({whatsappAccount:{findUnique:async()=>({organizationId:'other-org'}),upsert:async()=>assert.fail('não deve atualizar')}});
  global.fetch=async url=>{ const u=String(url); const body=u.includes('oauth/')?{access_token:'token'}:u.includes('/me/businesses')?{data:[{id:'b'}]}:u.includes('owned_')?{data:[{id:'w'}]}:u.includes('phone_numbers')?{data:[{id:'p'}]}:{}; return {ok:true,status:200,json:async()=>body}; };
  assert.match(await f.service.complete({code:'code',state:'state'}),/reason=phone_in_use/);
});
test('controller mantém autenticação e permissão de criação no endpoint', () => {
  const source=require('fs').readFileSync(require('path').join(__dirname,'../src/whatsapp/whatsapp.controller.ts'),'utf8');
  assert.match(source,/@UseGuards\(JwtAuthGuard, PermissionsGuard\)/); assert.match(source,/@Post\('embedded-signup\/session'\).*@Permissions\('whatsapp:accounts:create'\)/);
});
test('configuração ausente retorna código seguro e mensagem amigável', async () => {
  const saved = Object.fromEntries(Object.keys(env).map(key => [key, process.env[key]]));
  delete process.env.META_APP_ID;
  try {
    const f=fixture();
    await assert.rejects(f.service.createSession({id:'user-1'}), error => error.status === 503 && error.response.code === 'META_EMBEDDED_SIGNUP_NOT_CONFIGURED' && !JSON.stringify(error.response).includes('META_APP_SECRET'));
  } finally { Object.assign(process.env, saved); }
});
