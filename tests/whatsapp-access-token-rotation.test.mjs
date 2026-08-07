import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  new URL("../app/whatsapp/page.tsx", import.meta.url),
  "utf8",
);
const modal = readFileSync(
  new URL("../components/whatsapp/AccessTokenModal.tsx", import.meta.url),
  "utf8",
);
const view = readFileSync(
  new URL(
    "../components/connections/ConnectionsEnterprise.tsx",
    import.meta.url,
  ),
  "utf8",
);
const service = readFileSync(
  new URL("../services/whatsapp.service.ts", import.meta.url),
  "utf8",
);

test("rotação de credencial usa endpoint dedicado e ação exclusiva de global admin", () => {
  assert.match(service, /admin\/accounts\/\$\{id\}\/access-token/);
  assert.match(view, /p\.isGlobalAdmin && <>.*Atualizar credencial/s);
  assert.match(page, /if \(!globalAdmin\) return/);
});

test("modal nunca preenche token atual e limpa estado ao fechar", () => {
  assert.match(modal, /useState\(""\)/);
  assert.match(modal, /type=\{visible \? "text" : "password"\}/);
  assert.match(modal, /setAccessToken\(""\)/);
  assert.match(modal, /autoComplete="new-password"/);
  assert.doesNotMatch(modal, /localStorage|sessionStorage|console\./);
});

test("frontend traduz access token inválido conforme especificação", () => {
  assert.match(
    page,
    /WHATSAPP_INVALID_ACCESS_TOKEN.*O Access Token informado é inválido ou expirou\./s,
  );
  assert.match(page, /Credencial atualizada e conta validada com sucesso\./);
});
