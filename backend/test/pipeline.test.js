const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
require('reflect-metadata');

const { BadRequestException } = require('@nestjs/common');
const { DealStatus, Role } = require('@prisma/client');
const { PipelineController } = require('../dist/src/pipeline/pipeline.controller');
const { PipelineService } = require('../dist/src/pipeline/pipeline.service');
const { JwtAuthGuard } = require('../dist/src/auth/jwt-auth.guard');
const { RolesGuard } = require('../dist/src/auth/roles/roles.guard');

const user = { id: 'admin-1', role: Role.ADMIN };
const ctx = { id: user.id, role: Role.ADMIN, organizationId: 'org-1', global: false };
const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

function makePrisma(overrides = {}) {
  const state = { pipelineUpdateMany: [], movements: [], events: [], audits: [], assignments: [], dealUpdates: [], dealCreated: null, tags: [] };
  const prisma = {
    organization: { findFirst: async () => ({ id: 'org-1', active: true, deletedAt: null }) },
    user: { findFirst: async () => ({ id: 'user-1', active: true, deletedAt: null, role: Role.CORRETOR, organizationId: 'org-1' }) },
    lead: { findFirst: async (args) => args.where.organizationId === 'org-2' ? null : ({ id: args.where.id, organizationId: 'org-1', deletedAt: null }) },
    pipeline: { findFirst: async (args) => ({ id: args.where.id || 'pipe-1', organizationId: 'org-1', archivedAt: null, currency: 'BRL' }), findMany: async () => [], count: async () => 0, updateMany: async (args) => { state.pipelineUpdateMany.push(args); return { count: 1 }; }, create: async (args) => ({ id: 'pipe-new', ...args.data }), update: async (args) => ({ id: args.where.id, organizationId: 'org-1', ...args.data }) },
    pipelineStage: { findFirst: async (args) => ({ id: args.where.id || 'stage-1', organizationId: 'org-1', pipelineId: args.where.pipelineId || 'pipe-1', isActive: true }), findMany: async () => [{ id: 'stage-1', organizationId: 'org-1', pipelineId: 'pipe-1', position: 1 }], updateMany: async () => ({ count: 1 }), create: async (args) => ({ id: 'stage-new', ...args.data }), update: async (args) => ({ id: args.where.id, ...args.data }) },
    pipelineLossReason: { findFirst: async (args) => args.where.id === 'reason-1' ? ({ id: 'reason-1', organizationId: 'org-1', pipelineId: null }) : null, findMany: async () => [], create: async (args) => ({ id: 'reason-new', ...args.data }), update: async (args) => ({ id: args.where.id, ...args.data }) },
    tag: { findFirst: async () => ({ id: 'tag-1', organizationId: 'org-1', isActive: true }), findMany: async () => [], create: async (args) => ({ id: 'tag-new', ...args.data }), update: async (args) => ({ id: args.where.id, ...args.data }) },
    deal: { findFirst: async () => ({ id: 'deal-1', organizationId: 'org-1', leadId: 'lead-1', pipelineId: 'pipe-1', stageId: 'stage-1', status: DealStatus.OPEN, ownerId: 'user-1', estimatedValue: 100, currency: 'BRL', tags: [], activities: [] }), findMany: async () => [], count: async () => 0, create: async (args) => { state.dealCreated = args.data; return { id: 'deal-new', ...args.data }; }, update: async (args) => { state.dealUpdates.push(args); return { id: args.where.id, organizationId: 'org-1', ...args.data }; } },
    dealStageMovement: { create: async (args) => { state.movements.push(args.data); return { id: `mov-${state.movements.length}`, ...args.data }; }, findMany: async () => state.movements },
    dealEvent: { create: async (args) => { state.events.push(args.data); return { id: `event-${state.events.length}`, ...args.data }; }, findMany: async () => state.events },
    auditLog: { create: async (args) => { state.audits.push(args.data); return { id: `audit-${state.audits.length}`, ...args.data }; } },
    dealAssignment: { create: async (args) => { state.assignments.push(args.data); return { id: `assignment-${state.assignments.length}`, ...args.data }; } },
    dealTag: { upsert: async (args) => { state.tags.push(args.create); return { id: 'deal-tag-1', ...args.create }; }, deleteMany: async () => ({ count: 1 }) },
    dealActivity: { findFirst: async () => ({ id: 'activity-1', organizationId: 'org-1', dealId: 'deal-1' }), create: async (args) => ({ id: 'activity-1', ...args.data }), update: async (args) => ({ id: args.where.id, status: args.data.status || 'DONE', ...args.data }) },
    stageChecklist: { create: async (args) => ({ id: 'check-1', ...args.data }), findFirst: async () => ({ id: 'check-1', organizationId: 'org-1' }), update: async (args) => ({ id: args.where.id, ...args.data }) },
    $transaction: async (arg) => Array.isArray(arg) ? Promise.all(arg) : arg(prisma),
    __state: state,
  };
  return Object.assign(prisma, overrides);
}
function service(prisma = makePrisma()) { return new PipelineService(prisma, { resolve: async () => ctx }); }

test('protects pipeline routes with JwtAuthGuard and RolesGuard', () => {
  const guards = Reflect.getMetadata('__guards__', PipelineController) || [];
  assert.ok(guards.includes(JwtAuthGuard));
  assert.ok(guards.includes(RolesGuard));
  assert.deepEqual(Reflect.getMetadata('roles', PipelineController) || [], [Role.ADMIN, Role.CORRETOR]);
});

test('schema implements approved pipeline entities and removes DealWin DealLoss DealReopen and stage isWon isLost', () => {
  ['Pipeline','PipelineStage','StageChecklist','PipelineLossReason','Deal','DealStageMovement','DealEvent','DealAssignment','Tag','DealTag','DealActivity','AuditLog'].forEach(m => assert.match(schema, new RegExp(`model ${m} `)));
  ['model DealWin','model DealLoss','model DealReopen','isWon','isLost'].forEach(x => assert.equal(schema.includes(x), false));
  assert.match(schema, /closedValue\s+Decimal\?/);
  assert.match(schema, /lead\s+Lead\s+@relation/);
});

test('creating default pipeline unsets previous default and writes AuditLog', async () => {
  const prisma = makePrisma();
  await service(prisma).createPipeline({ organizationId: 'org-1', name: 'Vendas', isDefault: true }, user);
  assert.equal(prisma.__state.pipelineUpdateMany.length, 1);
  assert.equal(prisma.__state.audits[0].action, 'pipeline.created');
});

test('create deal validates tenant lead and creates CREATED movement, assignment, event and audit', async () => {
  const prisma = makePrisma();
  await service(prisma).createDeal({ organizationId: 'org-1', leadId: 'lead-1', pipelineId: 'pipe-1', stageId: 'stage-1', ownerId: 'user-1', title: 'Venda', estimatedValue: 100 }, user);
  assert.equal(prisma.__state.movements[0].movementType, 'CREATED');
  assert.equal(prisma.__state.assignments[0].toUserId, 'user-1');
  assert.equal(prisma.__state.events[0].eventType, 'DEAL_CREATED');
  assert.equal(prisma.__state.audits[0].action, 'deal.created');
  await assert.rejects(() => service(makePrisma({ lead: { findFirst: async () => null } })).createDeal({ organizationId: 'org-1', leadId: 'foreign', pipelineId: 'pipe-1', stageId: 'stage-1', title: 'x' }, user), /Lead não encontrado/);
});

test('stage movement blocks closed deal and open deal creates movement/event/audit', async () => {
  const prisma = makePrisma();
  await service(prisma).moveDeal('deal-1', { toStageId: 'stage-2' }, user);
  assert.equal(prisma.__state.movements[0].movementType, 'STAGE_CHANGED');
  assert.equal(prisma.__state.events[0].eventType, 'DEAL_STAGE_CHANGED');
  await assert.rejects(() => service(makePrisma({ deal: { ...prisma.deal, findFirst: async () => ({ id: 'deal-1', organizationId: 'org-1', pipelineId: 'pipe-1', stageId: 'stage-1', status: DealStatus.WON }) } })).moveDeal('deal-1', { toStageId: 'stage-2' }, user), BadRequestException);
});

test('assignment tags won lost reopen preserve estimated value and event history', async () => {
  const prisma = makePrisma();
  const s = service(prisma);
  await s.assignDeal('deal-1', { ownerId: 'user-2' }, user);
  await s.addTag('deal-1', 'tag-1', user);
  await s.removeTag('deal-1', 'tag-1', user);
  await s.won('deal-1', 250, undefined, 'ok', user);
  await s.lost('deal-1', 'reason-1', undefined, 'lost', user);
  const reopenPrisma = makePrisma({ deal: { ...prisma.deal, findFirst: async () => ({ id: 'deal-1', organizationId: 'org-1', leadId: 'lead-1', pipelineId: 'pipe-1', stageId: 'stage-1', status: DealStatus.LOST, ownerId: 'user-1', estimatedValue: 100, currency: 'BRL', tags: [], activities: [] }), update: prisma.deal.update } });
  reopenPrisma.__state = prisma.__state;
  await service(reopenPrisma).reopen('deal-1', { toStageId: 'stage-1' }, user);
  assert.ok(prisma.__state.assignments.find(a => a.toUserId === 'user-2'));
  assert.ok(prisma.__state.events.map(e => e.eventType).includes('DEAL_TAG_ADDED'));
  const won = prisma.__state.dealUpdates.find(u => u.data.status === 'WON');
  assert.equal(won.data.estimatedValue, undefined);
  assert.equal(String(won.data.closedValue), '250');
  assert.equal(prisma.__state.dealUpdates.find(u => u.data.status === 'LOST').data.lossReasonId, 'reason-1');
  assert.equal(prisma.__state.dealUpdates.find(u => u.data.status === 'REOPENED').data.closedValue, null);
});

test('validations reject invalid values and schema has kanban/filter indexes', async () => {
  await assert.rejects(() => service().createDeal({ organizationId: 'org-1', leadId: 'lead-1', pipelineId: 'pipe-1', stageId: 'stage-1', title: 'x', estimatedValue: -1 }, user), BadRequestException);
  await assert.rejects(() => service().createStage('pipe-1', { name: 'x', probability: 101 }, user), BadRequestException);
  ['@@index([organizationId, pipelineId, stageId, status])','@@index([organizationId, ownerId])','@@index([organizationId, expectedCloseDate])','@@index([organizationId, eventType, occurredAt])','@@index([organizationId, tagId])'].forEach(idx => assert.ok(schema.includes(idx)));
});
