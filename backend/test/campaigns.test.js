const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const controller = readFileSync('src/campaigns/campaigns.controller.ts', 'utf8');
const service = readFileSync('src/campaigns/campaigns.service.ts', 'utf8');
const createDto = readFileSync('src/campaigns/dto/create-campaign.dto.ts', 'utf8');
const listDto = readFileSync('src/campaigns/dto/list-campaigns.dto.ts', 'utf8');

test('campaign controller exposes CRUD, archive, restore and estimate endpoints', () => {
  for (const route of ['@Get()', '@Post()', '@Patch(\':id\')', '@Delete(\':id\')', '@Patch(\':id/archive\')', '@Patch(\':id/restore\')', '@Post(\'estimate\')']) assert.match(controller, new RegExp(route.replace(/[()]/g, '\\$&')));
});

test('campaign service implements pagination, search, soft delete, restore, archive and validation behaviors', () => {
  for (const token of ['skip: (page - 1) * limit', 'contains: query.search', 'deletedAt: new Date()', 'deletedAt: null', 'archivedAt', 'validateFilters', 'validateName']) assert.ok(service.includes(token), token);
});

test('campaign dtos validate campaign type and list filters', () => {
  assert.match(createDto, /IsEnum\(CampaignType\)/);
  assert.match(listDto, /campaignType/);
  assert.match(listDto, /archived/);
});

test('campaign declarations remain unique after duplicate cleanup review', () => {
  const campaignStatusBody = readFileSync('prisma/schema.prisma', 'utf8').match(/enum CampaignStatus \{([\s\S]*?)\n\}/)[1];
  assert.equal((campaignStatusBody.match(/\bPROCESSING\b/g) ?? []).length, 1);
  assert.equal((readFileSync('../services/campaigns.service.ts', 'utf8').match(/cancelCampaign\(/g) ?? []).length, 1);
  assert.equal((controller.match(/@Delete\(':id'\)/g) ?? []).length, 1);
});
