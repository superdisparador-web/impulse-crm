import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const service = read('services/analytics.service.ts');

test('campaign dashboard consumes the existing campaign funnel endpoint and renders every stage', () => {
  const component = read('components/analytics/CampaignIntelligence.tsx');
  assert.match(service, /\/analytics\/campaigns\/\$\{id\}\/funnel/);
  ['CTR', 'Delivery rate', 'Read rate', 'Conversão', 'Gargalo identificado', 'Tempo médio'].forEach((label) => assert.ok(component.includes(label)));
  assert.match(read('app/campaigns/[id]/page.tsx'), /CampaignIntelligence/);
});

test('broker and manager dashboards share the same responsive implementation', () => {
  const dashboard = read('components/analytics/PeopleDashboard.tsx');
  assert.match(read('app/analytics/brokers/page.tsx'), /mode="broker"/);
  assert.match(read('app/analytics/managers/page.tsx'), /mode="manager"/);
  ['Leads', 'Vendas', 'Campanhas', 'Mensagens', 'Cliques', 'Conversões', 'Histórico mensal', 'Detalhamento histórico'].forEach((label) => assert.ok(dashboard.includes(label)));
  assert.match(dashboard, /sm:grid-cols-2 xl:grid-cols-4/);
});

test('visual timeline consumes the existing lead timeline with filters and progressive pagination', () => {
  const timeline = read('app/leads/[id]/timeline/page.tsx');
  assert.match(read('services/lead.service.ts'), /\/leads\/\$\{id\}\/timeline/);
  ['Pesquisar timeline', 'Filtrar origem', 'Carregar mais eventos', 'Mensagem enviada', 'Mensagem entregue', 'Mensagem lida', 'Link acessado'].forEach((label) => assert.ok(timeline.includes(label)));
});

test('reports expose visual commercial filters with customer-friendly export', () => {
  const reports = read('app/reports/page.tsx');
  ['Campanha', 'Modelo de mensagem', 'Corretor', 'Gerente', 'Origem', 'Situação', 'Produto', 'Empreendimento', 'Baixar relatório'].forEach((label) => assert.ok(reports.includes(label)));
  assert.doesNotMatch(reports, /XLSX|infraestrutura|workaround/);
  assert.match(read('services/reports.service.ts'), /reports\/export\.csv/);
});

test('template analytics and events provide charts, search, ordering and pagination', () => {
  const templates = read('app/analytics/templates/page.tsx');
  const events = read('app/analytics/events/page.tsx');
  ['Comparativo de conversão', 'Ranking de templates', 'Última utilização'].forEach((label) => assert.ok(templates.includes(label)));
  ['Pesquisar eventos', 'Tipo do evento', 'Mais recentes', 'Página', 'WEBHOOK_RECEIVED', 'RECONCILIATION_EXECUTED'].forEach((label) => assert.ok(events.includes(label)));
});

test('professional chart primitives cover line, area, bars, pie, funnel and heatmap without a new dependency', () => {
  const charts = read('components/analytics/AnalyticsCharts.tsx');
  ['MiniLineChart', 'ComparisonBars', 'DonutChart', 'FunnelChart', 'SimpleHeatmap', 'linearGradient', 'conic-gradient'].forEach((primitive) => assert.ok(charts.includes(primitive)));
});
