import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function loadTypescriptModule(path, dependencies = {}) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  const localRequire = request => {
    if (request in dependencies) return dependencies[request];
    throw new Error(`Dependência de teste não configurada: ${request}`);
  };
  Function("require", "module", "exports", code)(localRequire, module, module.exports);
  return module.exports;
}

async function serviceWithApi(api) {
  return loadTypescriptModule("../services/whatsapp.service.ts", { "./api": { api } });
}

test("serviço envia cadastro manual somente no corpo do endpoint administrativo", async () => {
  const calls = [];
  const api = { post: async (path, body) => { calls.push({ path, body }); return { id: "account-1" }; } };
  const { whatsappService } = await serviceWithApi(api);
  const payload = { organizationId: "org-1", name: "Atendimento", wabaId: "waba-1", phoneNumberId: "phone-1", accessToken: "secret-token-value-long", apiVersion: "v23.0" };
  await whatsappService.createManualAccount(payload);
  assert.deepEqual(calls, [{ path: "/whatsapp/admin/accounts/manual", body: payload }]);
  assert.equal(calls[0].path.includes(payload.accessToken), false);
  assert.equal(global.localStorage, undefined);
  assert.equal(global.sessionStorage, undefined);
});

test("Embedded Signup permanece usando seu endpoint e não recebe credenciais manuais", async () => {
  global.window = { location: { origin: "https://crm.example.test" } };
  let call;
  const api = { post: async (path, body) => { call = { path, body }; return { authorizationUrl: "https://meta.example", expiresAt: "soon" }; } };
  try {
    const { whatsappService } = await serviceWithApi(api);
    await whatsappService.startEmbeddedSignup();
    assert.deepEqual(call, { path: "/whatsapp/embedded-signup/session", body: { returnUrl: "https://crm.example.test/whatsapp" } });
    assert.equal(JSON.stringify(call).includes("accessToken"), false);
  } finally { delete global.window; }
});
