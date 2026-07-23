const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');

test('whatsapp templates prisma model supports v1 fields and enums', () => {
  const schema = readFileSync('prisma/schema.prisma', 'utf8');
  assert.match(schema, /model WhatsappTemplate \{/);
  for (const field of ['displayName', 'metaName', 'headerType', 'headerText', 'body', 'footer', 'buttons', 'metaTemplateId', 'isActive', 'archivedAt', 'deletedAt']) assert.match(schema, new RegExp(field));
  const statusBody = schema.match(/enum WhatsappTemplateStatus \{([\s\S]*?)\n\}/)[1];
  for (const status of ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'DISABLED']) assert.match(statusBody, new RegExp(status));
  assert.doesNotMatch(statusBody, /PAUSED|DELETED/);
});

test('whatsapp templates backend exposes CRUD, search, pagination, archive, restore and validation', () => {
  const controller = readFileSync('src/whatsapp/whatsapp.controller.ts', 'utf8');
  const service = readFileSync('src/whatsapp/whatsapp.service.ts', 'utf8');
  const createDto = readFileSync('src/whatsapp/dto/create-whatsapp-template.dto.ts', 'utf8');
  const listDto = readFileSync('src/whatsapp/dto/list-whatsapp-templates.dto.ts', 'utf8');
  for (const route of ["@Get('templates')", "@Get('templates/:id')", "@Post('templates')", "@Patch('templates/:id')", "@Patch('templates/:id/archive')", "@Patch('templates/:id/restore')", "@Delete('templates/:id')"]) assert.ok(controller.includes(route));
  for (const method of ['findTemplates', 'createTemplate', 'updateTemplate', 'archiveTemplate', 'restoreTemplate', 'deleteTemplate', 'validateTemplate']) assert.match(service, new RegExp(method));
  assert.match(service, /skip:\(page-1\)\*pageSize/);
  assert.match(service, /contains:q\.search/);
  assert.match(createDto, /IsIn\(whatsappTemplateCategories\)/);
  assert.match(listDto, /pageSize/);
});
