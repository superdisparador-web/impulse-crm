import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const workspace = read("components/users/BrokersEnterprise.tsx");
const visuals = read("components/users/brokers/BrokerVisuals.tsx");
const usersPage = read("components/users/UsersPage.tsx");

const has = (source, values) =>
  values.forEach((value) =>
    assert.ok(source.includes(value), `expected ${value}`),
  );

test("Corretores preserves the approved public integration and management flows", () => {
  has(workspace, [
    "onCreate",
    "onEdit",
    "onStatus",
    "onResetPassword",
    "onRetry",
  ]);
  has(usersPage, [
    "<BrokersEnterprise",
    "handleStatus",
    "handleResetPassword",
    "openCreateForm",
    "openEditForm",
  ]);
});

test("executive cards preserve all available and unavailable indicators", () => {
  has(workspace, [
    "Total de corretores",
    "Corretores online",
    "Corretores offline",
    "Corretores ativos",
    "Corretores inativos",
    "Novos no mês",
    "Leads recebidos hoje",
    "Leads em atendimento",
    "Conversão média",
    "Tempo médio",
    "SLA médio",
    "Ranking geral",
  ]);
  has(visuals, ["Dados ainda não integrados", "aria-label={`${label}:"]);
});

test("filters remain searchable, clearable and collapsible with active feedback", () => {
  has(workspace, [
    "clearFilters",
    "Limpar",
    "filtersExpanded",
    'aria-controls="broker-advanced-filters"',
    "activeFilterCount",
    "corretores correspondem aos critérios",
  ]);
});

test("sorting and pagination remain available", () => {
  has(workspace, [
    "toggleSort",
    "Ordenar por",
    "Página anterior",
    "Próxima página",
    "PAGE_SIZE",
  ]);
});

test("selection, column configuration and CSV export remain available", () => {
  has(workspace, [
    "Selecionar todos da página",
    "aria-selected={selected}",
    "Exportar",
    "corretores.csv",
    "columnsOpen",
    "ALL_COLUMNS",
  ]);
});

test("drawer supports opening, overlay close, Escape and focus restoration", () => {
  has(workspace, [
    "setDrawer(user)",
    'event.key === "Escape"',
    "returnFocusRef.current?.focus()",
    'aria-modal="true"',
    "Fechar perfil",
  ]);
});

test("management actions remain conditional while unsupported actions stay disabled", () => {
  assert.match(workspace, /\{canManage &&/);
  has(workspace, [
    "Integrações futuras",
    "disabled title={`${label}: requer integração específica no backend`",
  ]);
});

test("screen states cover loading, errors, empty results and automatic refresh", () => {
  has(workspace, [
    "Carregando tabela",
    "Não foi possível carregar os corretores",
    "Nenhum corretor encontrado",
    "Tentar novamente",
  ]);
  has(visuals, ["Atualização automática ativa", "Atualizando"]);
});

test("team summary uses only available broker fields", () => {
  has(visuals, [
    "Resumo da equipe",
    "Ativos",
    "Inativos",
    "Online estimado",
    "Offline estimado",
    "Novos no mês",
  ]);
  assert.doesNotMatch(visuals, /Math\.random/);
});

test("automatic refresh remains at sixty seconds", () => {
  assert.match(usersPage, /setInterval\(\(\) => void loadUsers\(\), 60_000\)/);
});
