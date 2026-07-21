const test = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');

const { BadRequestException, ConflictException } = require('@nestjs/common');
const { LeadStatus, Role } = require('@prisma/client');
const { LeadsController } = require('../dist/src/leads/leads.controller');
const { LeadsService } = require('../dist/src/leads/leads.service');
const { JwtAuthGuard } = require('../dist/src/auth/jwt-auth.guard');
const { RolesGuard } = require('../dist/src/auth/roles/roles.guard');

const user = { id: 'admin-1', role: Role.ADMIN };
const ctx = { id: user.id, role: Role.ADMIN, organizationId: 'org-1', global: false };

function makePrisma(overrides = {}) {
  const state = { leadCreated: null, eventCreated: [], identityCreated: [], txLeadUpdate: null };
  const prisma = {
    organization: { findFirst: async () => ({ id: 'org-1', active: true }) },
    user: { findFirst: async () => ({ id: 'user-1', role: Role.CORRETOR, organizationId: 'org-1' }) },
    leadExternalIdentity: { findFirst: async () => null, create: async (args) => { state.identityCreated.push(args.data); return { id: 'identity-1', ...args.data }; } },
    lead: {
      findFirst: async (args) => args.where.id ? { id: args.where.id, organizationId: 'org-1', status: LeadStatus.NEW, temperature: 'UNKNOWN', assignedUserId: null, managerUserId: null, archivedAt: null, convertedAt: null, lostAt: null, externalIdentities: [], events: [] } : null,
      findMany: async () => [],
      count: async () => 0,
      create: async (args) => { state.leadCreated = args.data; return { id: 'lead-new', ...args.data }; },
      update: async (args) => { state.txLeadUpdate = args; return { id: args.where.id, ...args.data }; },
    },
    leadEvent: { create: async (args) => { state.eventCreated.push(args.data); return { id: `event-${state.eventCreated.length}`, ...args.data }; } },
    leadActivity: { create: async (args) => ({ id: 'activity-1', ...args.data }), findMany: async () => [], count: async () => 0, findFirst: async () => null },
    $transaction: async (arg) => Array.isArray(arg) ? Promise.all(arg) : arg(prisma),
    __state: state,
  };
  return Object.assign(prisma, overrides);
}

function makeService(prisma = makePrisma()) {
  return new LeadsService(prisma, { resolve: async () => ctx }, { forLead: async (leadId, organizationId) => ({ leadId, organizationId, items: [] }) });
}

test('protects lead routes with JwtAuthGuard and admin guard on delete', () => {
  const classGuards = Reflect.getMetadata('__guards__', LeadsController) || [];
  assert.ok(classGuards.includes(JwtAuthGuard));
  const deleteGuards = Reflect.getMetadata('__guards__', LeadsController.prototype.remove) || [];
  const roles = Reflect.getMetadata('roles', LeadsController.prototype.remove) || [];
  assert.ok(deleteGuards.includes(RolesGuard));
  assert.deepEqual(roles, [Role.ADMIN]);
});

test('creates lead with only phone and no required email or name', async () => {
  const prisma = makePrisma();
  const service = makeService(prisma);
  await service.create({ phone: '(81) 99999-0000', organizationId: 'org-1' }, user);
  assert.equal(prisma.__state.leadCreated.name, undefined);
  assert.equal(prisma.__state.leadCreated.email, undefined);
  assert.equal(prisma.__state.leadCreated.normalizedPhone, '+5581999990000');
  assert.equal(prisma.__state.eventCreated[0].eventType, 'LEAD_CREATED');
});

test('creates lead with external identity and no phone email or name', async () => {
  const prisma = makePrisma();
  const service = makeService(prisma);
  await service.create({ organizationId: 'org-1', source: 'META_ADS', externalIdentity: { provider: 'META', externalId: 'leadgen-1' } }, user);
  assert.equal(prisma.__state.leadCreated.source, 'META_ADS');
  assert.equal(prisma.__state.identityCreated[0].externalId, 'leadgen-1');
});

test('rejects lead creation without phone email or external identity', async () => {
  await assert.rejects(() => makeService().create({ organizationId: 'org-1', name: 'Sem contato' }, user), BadRequestException);
});

test('deduplicates by document before phone and email', async () => {
  const base = makePrisma();
  const prisma = makePrisma({ lead: { ...base.lead, findFirst: async (args) => args.where.document ? { id: 'duplicate' } : base.lead.findFirst(args) } });
  const service = makeService(prisma);
  await assert.rejects(() => service.create({ organizationId: 'org-1', document: '123.456.789-00', phone: '81999990000' }, user), ConflictException);
});
