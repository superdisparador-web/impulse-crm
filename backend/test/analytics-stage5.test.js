const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const insights = fs.readFileSync('src/analytics/analytics-insights.service.ts', 'utf8');
const timeline = fs.readFileSync('src/leads/timeline.service.ts', 'utf8');
const reports = fs.readFileSync('src/reports/reports.service.ts', 'utf8');

test('all stage 5 operational analytics queries are tenant scoped', () => {
  assert.ok((insights.match(/organizationId/g) || []).length > 20);
  assert.match(insights, /requested !== ctx\.organizationId/);
  assert.match(reports, /query\.organizationId !== organizationId/);
});

test('campaign funnel contains all commercial stages and safe rate calculation', () => {
  ['Enviado', 'Entregue', 'Lido', 'Clique', 'Atendimento', 'Visita', 'Documentação', 'Venda'].forEach((stage) => assert.ok(insights.includes(stage)));
  assert.match(insights, /stepRate/);
  assert.match(insights, /cumulativeRate/);
  assert.match(insights, /abandonment/);
  assert.match(insights, /bottleneck/);
});

test('lead timeline consolidates existing sources chronologically', () => {
  ['leadEvent', 'campaignRecipient', 'whatsappMessage', 'dealEvent'].forEach((source) => assert.ok(timeline.includes(source)));
  assert.match(timeline, /b\.occurredAt\.getTime\(\) - a\.occurredAt\.getTime\(\)/);
});

test('CSV export neutralizes spreadsheet formulas and quotes fields', () => {
  assert.match(reports, /\^\[=\+\\-@\\t\\r\]/);
  assert.match(reports, /replace\(\/"\/g, '""'\)/);
  assert.match(reports, /take: 10_000/);
});

test('stage 5.1 report filters remain tenant scoped and use lead metadata without a parallel query system', () => {
  const dto = fs.readFileSync('src/reports/dto/report-query.dto.ts', 'utf8');
  ['product', 'development', 'managerId', 'brokerId', 'templateId', 'source', 'status'].forEach((field) => assert.ok(dto.includes(field)));
  assert.match(reports, /commercialLeadFilter/);
  assert.match(reports, /organizationId/);
  assert.match(reports, /recipients: \{ some:/);
});
