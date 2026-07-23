import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('templates menu, list page and service are wired', () => {
  const sidebar = readFileSync('components/layout/Sidebar.tsx', 'utf8');
  const page = readFileSync('app/templates/page.tsx', 'utf8');
  const service = readFileSync('services/templates.service.ts', 'utf8');
  assert.match(sidebar, /title: "Templates"/);
  assert.match(page, /Novo Template/);
  assert.match(page, /templatesService\.getTemplates/);
  assert.match(service, /getTemplates/);
  assert.match(service, /archiveTemplate/);
  assert.match(service, /restoreTemplate/);
});

test('template wizard has four steps and whatsapp preview', () => {
  const wizard = readFileSync('app/templates/new/page.tsx', 'utf8');
  for (const label of ['Informações', 'Conteúdo', 'Pré-visualização', 'Resumo']) assert.match(wizard, new RegExp(label));
  assert.match(wizard, /Preview/);
  assert.match(wizard, /templatesService\.createTemplate/);
  assert.match(wizard, /templatesService\.updateTemplate/);
});
