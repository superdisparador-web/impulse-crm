import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { canCancelCampaign, primaryCampaignAction, shouldPollCampaign } from '../app/campaigns/campaign-operational-ui.mjs';

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

test('campaign wizard has four accessible preparation steps', () => {
  assert.match(wizardPage, /Informações básicas/);
  assert.match(wizardPage, /Marketing/);
  assert.match(wizardPage, /Utilidade/);
  assert.match(wizardPage, /Autenticação/);
  assert.match(wizardPage, /Lista de contatos/);
  assert.match(wizardPage, /Template e configurações/);
  assert.match(wizardPage, /Pré-visualização completa do WhatsApp/);
  assert.match(wizardPage, /aria-current/);
  assert.match(wizardPage, /SALVAR CAMPANHA COMO RASCUNHO/);
  assert.match(wizardPage, /Salvar rascunho/);
});

test('campaign wizard keeps state while moving back and blocks incomplete continuation', () => {
  assert.match(wizardPage, /setStep\(s=>s-1\)/);
  assert.match(wizardPage, /!summary\?\.valid\|\|!listConfirmed/);
  assert.match(wizardPage, /beforeunload/);
});

test('campaign wizard exposes CSV upload, hygiene, samples and safe exports', () => {
  assert.match(wizardPage, /accept="\.csv,text\/csv"/);
  assert.match(wizardPage, /Higienizar lista/);
  assert.match(wizardPage, /Amostra válida/);
  assert.match(wizardPage, /downloadList/);
});

test('campaign wizard maps every normalized variable including buttonIndex', () => {
  assert.match(wizardPage, /selectedTemplate\?\.variables\.map/);
  assert.match(wizardPage, /buttonIndex/);
  for (const source of ['COLUMN','FIXED','LEAD_NAME','LEAD_PHONE']) assert.match(wizardPage, new RegExp(source));
});

test('campaign wizard supports media, complete preview and destinations', () => {
  assert.match(wizardPage, /uploadMedia/);
  assert.match(wizardPage, /headerText/);
  assert.match(wizardPage, /template\?\.body/);
  assert.match(wizardPage, /template\?\.footer/);
  assert.match(wizardPage, /template\?\.buttons/);
  for (const mode of ['FIXED_URL','AGENT_FIXED','ROUND_ROBIN']) assert.match(wizardPage, new RegExp(mode));
});

test('campaign draft reopens and final review remains draft-only', () => {
  assert.match(wizardPage, /getCampaignById/);
  assert.match(wizardPage, /currentStep/);
  assert.match(wizardPage, /SALVAR CAMPANHA COMO RASCUNHO/);
  assert.match(wizardPage, /Nenhuma mensagem será enviada/);
});

test('campaign frontend service exposes CRUD and restore endpoints', () => {
  assert.match(service, /getCampaigns/);
  assert.match(service, /createCampaign/);
  assert.match(service, /updateCampaign/);
  assert.match(service, /deleteCampaign/);
  assert.match(service, /restoreCampaign/);
});

test('campaign operational actions are constrained by backend lifecycle',()=>{assert.equal(primaryCampaignAction('DRAFT'),'validate');assert.equal(primaryCampaignAction('READY'),'start');assert.equal(primaryCampaignAction('RUNNING'),'pause');assert.equal(primaryCampaignAction('PAUSED'),'resume');assert.equal(primaryCampaignAction('COMPLETED'),null);assert.equal(canCancelCampaign('SCHEDULED'),true);assert.equal(canCancelCampaign('CANCELED'),false);});
test('campaign polling stops for hidden tabs and final states',()=>{assert.equal(shouldPollCampaign('RUNNING',false),true);assert.equal(shouldPollCampaign('RUNNING',true),false);assert.equal(shouldPollCampaign('COMPLETED',false),false);assert.equal(shouldPollCampaign('CANCELED',false),false);});
