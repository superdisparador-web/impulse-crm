import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("app/analytics/page.tsx", "utf8");
const service = readFileSync("services/analytics.service.ts", "utf8");
const sidebar = readFileSync("components/layout/Sidebar.tsx", "utf8");

test("analytics dashboard provides loading, error, KPIs, rates, ranking and alerts", () => {
  [
    "Carregando inteligência comercial",
    "Não foi possível carregar",
    "Campanhas ativas",
    "CTR",
    "Read rate",
    "Delivery rate",
    "Ranking de campanhas",
    "Alertas operacionais",
  ].forEach((label) => assert.ok(page.includes(label)));
});

test("analytics uses the authenticated API boundary and is navigable", () => {
  assert.match(service, /api\.get<ExecutiveAnalytics>/);
  assert.match(service, /\/analytics\/executive/);
  assert.match(sidebar, /href: "\/analytics"/);
});
