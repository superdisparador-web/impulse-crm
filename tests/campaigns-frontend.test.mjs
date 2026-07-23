import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const listPage = readFileSync('app/campaigns/page.tsx', 'utf8');
const wizardPage = readFileSync('app/campaigns/new/page.tsx', 'utf8');
const service = readFileSync('services/campaigns.service.ts', 'utf8');

test('campaign list supports pagination, search, filters, archive and restore actions', () => {
  assert.match(listPage, /placeholder="Buscar por nome ou descrição"/);
  assert.match(listPage, /Todos os status/);
  assert.match(listPage, /Todos os tipos/);
  assert.match(listPage, /Arquivadas/);
  assert.match(listPage, /Anterior/);
  assert.match(listPage, /Próxima/);
  assert.match(listPage, /archiveCampaign/);
});

test('campaign wizard has information, filters and summary behavioral steps', () => {
  assert.match(wizardPage, /Informações/);
  assert.match(wizardPage, /Marketing/);
  assert.match(wizardPage, /Utilidade/);
  assert.match(wizardPage, /Autenticação/);
  assert.match(wizardPage, /Quantidade estimada de contatos/);
  assert.match(wizardPage, /Salvar rascunho/);
});

test('campaign frontend service exposes CRUD and restore endpoints', () => {
  assert.match(service, /getCampaigns/);
  assert.match(service, /createCampaign/);
  assert.match(service, /updateCampaign/);
  assert.match(service, /deleteCampaign/);
  assert.match(service, /restoreCampaign/);
});
