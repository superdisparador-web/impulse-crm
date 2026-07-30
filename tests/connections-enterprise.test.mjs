import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const page = readFileSync("app/connections/page.tsx", "utf8");
const ui = readFileSync("components/connections/ConnectionsEnterprise.tsx", "utf8");
const has = values => values.forEach(value => assert.ok(ui.includes(value), `expected ${value}`));
const componentBody = page.slice(page.indexOf("export default function ConnectionsPage"));
const mainReturn = componentBody.lastIndexOf("return <>");
const returnedTree = componentBody.slice(mainReturn);

test("route has no legacy placeholder and its main return renders the complete module", () => {
  assert.doesNotMatch(page, /Módulo em preparação/);
  assert.ok(mainReturn > 0, "expected the fragment main return");
  for (const component of ["ConnectionsEnterprise", "AccountModal", "ArchiveModal"])
    assert.match(returnedTree, new RegExp(`<${component}(?:\\s|>)`));
});

test("all React hooks execute before the main return", () => {
  const afterReturn = componentBody.slice(mainReturn);
  assert.doesNotMatch(afterReturn, /\b(?:useState|useEffect|useMemo|useRef|useCallback)\s*\(/);
  for (const hook of ["useState", "useEffect", "useMemo", "useRef", "useCallback"])
    assert.ok(componentBody.slice(0, mainReturn).includes(`${hook}(`), `expected ${hook} before return`);
});

test("route uses the established global-admin helper and real management roles", () => {
  assert.match(page, /import \{ getCurrentUser, isGlobalAdmin \} from "@\/services\/auth"/);
  assert.match(page, /isGlobalAdmin\(\)/);
  assert.match(page, /role === "GLOBAL_ADMIN"/);
  assert.match(page, /role === "ORG_ADMIN"/);
  assert.doesNotMatch(page, /role === "ADMIN"/);
});

test("enterprise component receives state and every supported operation", () => {
  const invocation = returnedInvocation(returnedTree, "ConnectionsEnterprise");
  for (const prop of ["accounts", "loading", "error", "canManage", "onCreate", "onEdit", "onTest", "onSync", "onToggle", "onArchive"])
    assert.match(invocation, new RegExp(`\\b${prop}=`), `missing ${prop}`);
});

test("route retains only existing service contracts", () => { ["getAccounts", "createAccount", "updateAccount", "testAccount", "syncAccount", "updateStatus", "deleteAccount"].forEach(value => assert.ok(page.includes(value))); });
test("executive dashboard declares all honest metrics", () => has(["Total de conexões", "Conectadas", "Desconectadas", "Com erro", "Em configuração", "Números ativos", "Qualidade alta", "Qualidade média", "Qualidade baixa", "Limite diário total", "Mensagens enviadas hoje", "Última sincronização", "Dados ainda não integrados"]));
test("search filters sorting pagination selection and export are available", () => has(["setDebounced", "Limpar filtros", "setSort", "Página anterior", "Próxima página", "aria-selected={checked}", "Selecionar todas da página", "Exportar CSV", "conexoes-whatsapp.csv"]));
test("drawer supports tabs Escape and focus restoration", () => has(["Visão geral", "Configuração", "Saúde", "Webhook", "Templates", "Histórico", "Segurança", 'event.key === "Escape"', "returnFocusRef.current?.focus()", 'aria-modal="true"']));
test("secrets do not enter table or CSV", () => { assert.doesNotMatch(ui, /tokenLast4|accessToken|verifyToken|appSecret/); assert.ok(ui.includes("Verify Token e segredos nunca são exibidos")); assert.ok(ui.includes("mask(account.wabaId)")); });
test("RBAC and unsupported operations are explicit", () => { assert.ok(ui.includes("p.canManage ?")); has(["Integrações futuras", "endpoint ainda não disponível", "Somente administradores podem gerenciar"]); });
test("automatic refresh pauses while hidden and operations are active", () => { assert.match(page, /setInterval[\s\S]*60_000/); has(["Atualização automática ativa", "Carregando conexões", "Nenhuma conexão oficial cadastrada", "Nenhuma conexão encontrada"]); assert.ok(page.includes('document.visibilityState === "visible" && !editing && !busyId')); });

function returnedInvocation(source, component) {
  const start = source.indexOf(`<${component}`);
  assert.notEqual(start, -1, `missing ${component}`);
  const end = source.indexOf("/>", start);
  assert.notEqual(end, -1, `unclosed ${component}`);
  return source.slice(start, end + 2);
}
