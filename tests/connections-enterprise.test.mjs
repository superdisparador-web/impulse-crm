import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacy = readFileSync("app/connections/page.tsx", "utf8");
const page = readFileSync("app/whatsapp/page.tsx", "utf8");
const ui = readFileSync(
  "components/connections/ConnectionsEnterprise.tsx",
  "utf8",
);
const sidebar = readFileSync("components/layout/Sidebar.tsx", "utf8");
const service = readFileSync("services/whatsapp.service.ts", "utf8");

test("legacy route redirects and sidebar exposes one WhatsApp entry", () => {
  assert.match(legacy, /redirect\("\/whatsapp"\)/);
  assert.equal((sidebar.match(/title: "WhatsApp"/g) ?? []).length, 1);
  assert.doesNotMatch(sidebar, /title: "Conexões"/);
});

test("Embedded Signup is the only account creation path", () => {
  assert.match(page, /startEmbeddedSignup/);
  assert.match(service, /\/whatsapp\/embedded-signup\/session/);
  assert.doesNotMatch(page, /createAccount/);
  for (const text of [
    "Conectar WhatsApp Oficial",
    "Adicionar outra conta",
    "Conectando com a Meta",
    "Autorização concluída",
    "Sincronizando número e templates",
    "Conta conectada com sucesso",
  ])
    assert.ok(`${page}${ui}`.includes(text), `missing ${text}`);
});

test("unified screen retains real operations, metrics and filters", () => {
  for (const operation of [
    "testAccount",
    "syncAccount",
    "updateStatus",
    "setDefault",
    "restoreAccount",
    "deleteAccount",
    "updateAccount",
  ])
    assert.ok(page.includes(operation), `missing ${operation}`);
  for (const text of [
    "Total de contas",
    "Conectadas",
    "Desconectadas",
    "Com erro",
    "Em configuração",
    "Qualidade baixa",
    "WABA ID ou Phone Number ID",
    "Arquivadas",
  ])
    assert.ok(ui.includes(text), `missing ${text}`);
});

test("technical settings are global-admin only and do not render secrets", () => {
  assert.match(page, /isGlobalAdmin={globalAdmin}/);
  assert.match(ui, /p\.isGlobalAdmin/);
  assert.match(
    ui,
    /App Secret, access token e token de verificação nunca são exibidos/,
  );
  assert.doesNotMatch(ui, /form\.credential|form\.verifyToken/);
});

test("OAuth errors are mapped to safe user messages", () => {
  for (const text of [
    "Login cancelado",
    "Permissão não concedida",
    "Nenhuma empresa selecionada",
    "Nenhuma conta WhatsApp selecionada",
    "Número já vinculado",
    "Não foi possível concluir a conexão",
  ])
    assert.ok(page.includes(text), `missing ${text}`);
});
