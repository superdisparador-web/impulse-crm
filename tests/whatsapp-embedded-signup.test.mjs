import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("app/whatsapp/page.tsx", "utf8");
const ui = readFileSync("components/connections/ConnectionsEnterprise.tsx", "utf8");
const service = readFileSync("services/whatsapp.service.ts", "utf8");
const api = readFileSync("services/api.ts", "utf8");
const controller = readFileSync("backend/src/whatsapp/whatsapp.controller.ts", "utf8");
const embedded = readFileSync("backend/src/whatsapp/embedded-signup/embedded-signup.service.ts", "utf8");
const whatsappModule = readFileSync("backend/src/whatsapp/whatsapp.module.ts", "utf8");
const appModule = readFileSync("backend/src/app.module.ts", "utf8");
const backendMain = readFileSync("backend/src/main.ts", "utf8");

test("both connect buttons execute the same Embedded Signup service action", () => {
  assert.match(page, /onConnect=\{\(\) => void connect\(\)\}/);
  assert.match(page, /whatsappService\.startEmbeddedSignup\(\)/);
  assert.ok((ui.match(/onClick=\{p\.onConnect\}|onClick=\{connect\}/g) ?? []).length >= 2);
});

test("frontend posts to the authenticated Embedded Signup endpoint", () => {
  assert.match(service, /api\.post<[^>]+>\('\/whatsapp\/embedded-signup\/session'/);
  assert.match(api, /headers\.set\("Authorization", `Bearer \$\{token\}`\)/);
  assert.match(api, /const accessToken = getAccessToken\(\)/);
});

test("backend exposes and registers the session endpoint without a global prefix", () => {
  assert.match(controller, /@Controller\('whatsapp'\)/);
  assert.match(controller, /@Post\('embedded-signup\/session'\)/);
  assert.match(controller, /@UseGuards\(JwtAuthGuard, PermissionsGuard\)/);
  assert.match(whatsappModule, /controllers:[\s\S]*WhatsappController/);
  assert.match(whatsappModule, /providers:[\s\S]*EmbeddedSignupService/);
  assert.match(appModule, /imports:[\s\S]*WhatsappModule/);
  assert.doesNotMatch(backendMain, /setGlobalPrefix/);
});

test("connection failures have safe and specific messages with development diagnostics", () => {
  for (const message of [
    "A integração com a Meta ainda não foi configurada pelo administrador.",
    "Não foi possível acessar o servidor. Verifique se o backend está iniciado.",
    "A Meta não autorizou o início da conexão. Verifique as configurações do aplicativo.",
  ]) assert.ok(page.includes(message), `missing message: ${message}`);
  assert.match(page, /error instanceof TypeError/);
  assert.match(page, /process\.env\.NODE_ENV !== "production"/);
  assert.match(page, /console\.error/);
});

test("configuration is validated before a signup state is persisted", () => {
  const validation = embedded.indexOf("const config = this.config()", embedded.indexOf("async createSession"));
  const persistence = embedded.indexOf("whatsappEmbeddedSignupState.create", validation);
  assert.ok(validation > 0 && persistence > validation);
  for (const key of ["META_APP_ID", "META_APP_SECRET", "META_CONFIG_ID", "META_REDIRECT_URI", "META_GRAPH_API_VERSION", "META_TOKEN_ENCRYPTION_KEY", "FRONTEND_URL"])
    assert.ok(embedded.includes(`'${key}'`), `missing configuration: ${key}`);
});

test("empty account state provides clear official Meta call to action", () => {
  for (const text of [
    "Nenhuma conta do WhatsApp conectada",
    "Conecte sua conta oficial da Meta para enviar mensagens, acompanhar a qualidade dos números e gerenciar suas campanhas.",
    "Conectar WhatsApp Oficial",
    "A conexão é realizada com segurança pelo ambiente oficial da Meta.",
    "ShieldCheck",
    "/branding/empty-state.png",
  ]) assert.ok(ui.includes(text), `missing empty-state content: ${text}`);
});

test("indicators are derived from returned account data instead of fixed values", () => {
  assert.match(ui, /const active = p\.accounts\.filter/);
  assert.match(ui, /const count = \(value: WhatsappAccountStatus\) => active\.filter/);
  assert.match(ui, /\["Total de contas", p\.total\]/);
  assert.match(ui, /qualityRating\?\.toUpperCase\(\) === "RED"/);
});
