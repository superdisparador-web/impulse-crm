const assert = require('node:assert/strict');
const { test } = require('node:test');
const { PipelineService } = require('../dist/src/pipeline/pipeline.service');

const user = { id: 'user-1', role: 'ADMIN' };
const now = () => new Date('2026-07-23T12:00:00.000Z');

function createHarness(seed = {}) {
  const state = {
    organizations: seed.organizations ?? [{ id: 'org-1', active: true, deletedAt: null }, { id: 'org-2', active: true, deletedAt: null }],
    pipelines: seed.pipelines ?? [],
    stages: seed.stages ?? [],
    cards: seed.cards ?? [],
    leads: seed.leads ?? [],
    audits: [],
    analytics: [],
  };
  let seq = 1;
  const match = (row, where = {}) => Object.entries(where).every(([key, expected]) => {
    if (key === 'id' && expected && typeof expected === 'object' && Array.isArray(expected.in)) return expected.in.includes(row.id);
    if (key === 'id' && expected && typeof expected === 'object' && expected.not) return row.id !== expected.not;
    if (key === 'position' && expected && typeof expected === 'object' && expected.gte !== undefined) return row.position >= expected.gte;
    return row[key] === expected;
  });
  const order = (rows, orderBy) => {
    const keys = Array.isArray(orderBy) ? orderBy : [orderBy];
    return [...rows].sort((a, b) => {
      for (const item of keys) {
        const [key, direction] = Object.entries(item)[0];
        if (a[key] === b[key]) continue;
        return (a[key] > b[key] ? 1 : -1) * (direction === 'desc' ? -1 : 1);
      }
      return 0;
    });
  };
  const includePipeline = (pipeline, include) => include?.stages ? { ...pipeline, stages: order(state.stages.filter(stage => stage.pipelineId === pipeline.id && stage.deletedAt === null), include.stages.orderBy) } : pipeline;
  const includeCard = (card, include) => include?.lead ? { ...card, lead: state.leads.find(lead => lead.id === card.leadId) } : card;
  const tx = {
    pipeline: {
      findFirst: async ({ where }) => state.pipelines.find(row => match(row, where)) ?? null,
      create: async ({ data }) => { const row = { id: `pipeline-${seq++}`, description: null, isDefault: false, active: true, createdAt: now(), updatedAt: now(), deletedAt: null, ...data }; state.pipelines.push(row); return row; },
      updateMany: async ({ where, data }) => { const rows = state.pipelines.filter(row => match(row, where)); rows.forEach(row => Object.assign(row, data)); return { count: rows.length }; },
    },
    pipelineStage: {
      createMany: async ({ data }) => { data.forEach(item => state.stages.push({ id: `stage-${seq++}`, description: null, active: true, deletedAt: null, createdAt: now(), updatedAt: now(), ...item })); return { count: data.length }; },
      update: async ({ where, data }) => Object.assign(state.stages.find(row => row.id === where.id), data, { updatedAt: now() }),
      findMany: async ({ where, orderBy }) => order(state.stages.filter(row => match(row, where)), orderBy),
    },
    pipelineLead: {
      update: async ({ where, data }) => Object.assign(state.cards.find(row => row.id === where.id), data, { updatedAt: now() }),
      updateMany: async ({ where, data }) => { const rows = state.cards.filter(row => match(row, where)); rows.forEach(row => data.position?.increment ? row.position += data.position.increment : Object.assign(row, data)); return { count: rows.length }; },
      count: async ({ where }) => state.cards.filter(row => match(row, where)).length,
      findMany: async ({ where, orderBy }) => order(state.cards.filter(row => match(row, where)), orderBy),
    },
  };
  const prisma = {
    organization: { findFirst: async ({ where }) => state.organizations.find(row => match(row, where)) ?? null },
    pipeline: {
      findFirst: async ({ where, include }) => { const row = state.pipelines.find(item => match(item, where)); return row ? includePipeline(row, include) : null; },
      findMany: async ({ where, include, orderBy }) => order(state.pipelines.filter(row => match(row, where)).map(row => includePipeline(row, include)), orderBy),
      create: tx.pipeline.create,
      update: async ({ where, data }) => Object.assign(state.pipelines.find(row => row.id === where.id), data, { updatedAt: now() }),
      updateMany: tx.pipeline.updateMany,
    },
    pipelineStage: {
      findFirst: async ({ where }) => state.stages.find(row => match(row, where)) ?? null,
      findMany: async ({ where, orderBy, include }) => order(state.stages.filter(row => match(row, where)).map(stage => include?.cards ? { ...stage, cards: order(state.cards.filter(card => card.stageId === stage.id && card.deletedAt === null), include.cards.orderBy).map(card => includeCard(card, include.cards.include)) } : stage), orderBy),
      count: async ({ where }) => state.stages.filter(row => match(row, where)).length,
      create: async ({ data }) => { const row = { id: `stage-${seq++}`, description: null, active: true, deletedAt: null, createdAt: now(), updatedAt: now(), ...data }; state.stages.push(row); return row; },
      update: tx.pipelineStage.update,
    },
    pipelineLead: {
      findFirst: async ({ where, include }) => { const row = state.cards.find(item => match(item, where)); return row ? includeCard(row, include) : null; },
      findMany: async ({ where, include, orderBy }) => order(state.cards.filter(row => match(row, where)).map(row => includeCard(row, include)), orderBy),
      count: tx.pipelineLead.count,
      create: async ({ data }) => { const row = { id: `card-${seq++}`, enteredStageAt: now(), createdAt: now(), updatedAt: now(), deletedAt: null, ...data }; state.cards.push(row); return row; },
      update: tx.pipelineLead.update,
      updateMany: tx.pipelineLead.updateMany,
    },
    lead: { findFirst: async ({ where }) => state.leads.find(row => match(row, where)) ?? null },
    $transaction: async (callback) => callback(tx),
  };
  const service = new PipelineService(prisma, { resolve: async () => ({ global: false, organizationId: 'org-1' }) }, { record: async payload => state.audits.push(payload) }, { emit: async payload => state.analytics.push(payload) });
  return { service, state };
}

test('creates pipeline scoped to authenticated organization and audits creation', async () => {
  const { service, state } = createHarness();
  const pipeline = await service.createPipeline({ name: ' Vendas ' }, user);
  assert.equal(pipeline.organizationId, 'org-1');
  assert.equal(pipeline.name, 'Vendas');
  assert.equal(state.audits[0].action, 'pipeline.created');
});

test('blocks cross-tenant lead inclusion and duplicate cards', async () => {
  const { service, state } = createHarness({ pipelines: [{ id: 'pipe-1', organizationId: 'org-1', name: 'Vendas', active: true, deletedAt: null }], stages: [{ id: 'stage-1', organizationId: 'org-1', pipelineId: 'pipe-1', name: 'Novo', position: 1, active: true, deletedAt: null }], leads: [{ id: 'lead-2', organizationId: 'org-2', name: 'Outro', assignedUserId: null, managerUserId: null, deletedAt: null }] });
  await assert.rejects(() => service.addCard('pipe-1', { leadId: 'lead-2', stageId: 'stage-1' }, user), /Lead não encontrado/);
  state.leads.push({ id: 'lead-1', organizationId: 'org-1', name: 'Lead', assignedUserId: null, managerUserId: null, deletedAt: null });
  await service.addCard('pipe-1', { leadId: 'lead-1', stageId: 'stage-1' }, user);
  await assert.rejects(() => service.addCard('pipe-1', { leadId: 'lead-1', stageId: 'stage-1' }, user), /Lead já está neste pipeline/);
});

test('moves cards transactionally, clamps oversized positions, preserves order and emits analytics on stage change', async () => {
  const { service, state } = createHarness({ pipelines: [{ id: 'pipe-1', organizationId: 'org-1', name: 'Vendas', active: true, deletedAt: null }], stages: [{ id: 'stage-1', organizationId: 'org-1', pipelineId: 'pipe-1', name: 'Novo', position: 1, active: true, deletedAt: null }, { id: 'stage-2', organizationId: 'org-1', pipelineId: 'pipe-1', name: 'Proposta', position: 2, active: true, deletedAt: null }], leads: [{ id: 'lead-1', organizationId: 'org-1', name: 'Lead 1', assignedUserId: 'broker-1', managerUserId: 'manager-1', deletedAt: null }, { id: 'lead-2', organizationId: 'org-1', name: 'Lead 2', assignedUserId: null, managerUserId: null, deletedAt: null }], cards: [{ id: 'card-1', organizationId: 'org-1', pipelineId: 'pipe-1', stageId: 'stage-1', leadId: 'lead-1', position: 1, enteredStageAt: now(), updatedAt: now(), deletedAt: null }, { id: 'card-2', organizationId: 'org-1', pipelineId: 'pipe-1', stageId: 'stage-1', leadId: 'lead-2', position: 2, enteredStageAt: now(), updatedAt: now(), deletedAt: null }] });
  const moved = await service.moveCard('card-1', { stageId: 'stage-2', position: 99 }, user);
  assert.equal(moved.stageId, 'stage-2');
  assert.equal(moved.position, 1);
  assert.equal(state.cards.find(card => card.id === 'card-2').position, 1);
  assert.equal(state.analytics[0].eventType, 'LEAD_STAGE_CHANGED');
  assert.deepEqual(state.analytics[0].metadata, { pipelineId: 'pipe-1', fromStageId: 'stage-1', toStageId: 'stage-2' });
});

test('returns ordered board with safe lead summary', async () => {
  const { service } = createHarness({ pipelines: [{ id: 'pipe-1', organizationId: 'org-1', name: 'Vendas', active: true, deletedAt: null }], stages: [{ id: 'stage-2', organizationId: 'org-1', pipelineId: 'pipe-1', name: 'B', position: 2, active: true, deletedAt: null }, { id: 'stage-1', organizationId: 'org-1', pipelineId: 'pipe-1', name: 'A', position: 1, active: true, deletedAt: null }], leads: [{ id: 'lead-1', organizationId: 'org-1', name: 'Lead', phone: '1', email: 'a@b.test', status: 'NEW', temperature: 'HOT', assignedUserId: 'broker-1', managerUserId: 'manager-1', assignedUser: { id: 'broker-1', name: 'Broker' }, deletedAt: null }], cards: [{ id: 'card-1', organizationId: 'org-1', pipelineId: 'pipe-1', stageId: 'stage-1', leadId: 'lead-1', position: 1, enteredStageAt: now(), updatedAt: now(), deletedAt: null }] });
  const board = await service.board('pipe-1', user);
  assert.deepEqual(board.stages.map(stage => stage.id), ['stage-1', 'stage-2']);
  assert.equal(board.stages[0].cards[0].lead.name, 'Lead');
  assert.equal('assignedUserId' in board.stages[0].cards[0].lead, false);
});

test('blocks deleting a stage with cards and keeps default pipeline creation idempotent', async () => {
  const { service, state } = createHarness({ pipelines: [{ id: 'pipe-1', organizationId: 'org-1', name: 'Vendas', active: true, deletedAt: null }], stages: [{ id: 'stage-1', organizationId: 'org-1', pipelineId: 'pipe-1', name: 'Novo', position: 1, active: true, deletedAt: null }], cards: [{ id: 'card-1', organizationId: 'org-1', pipelineId: 'pipe-1', stageId: 'stage-1', leadId: 'lead-1', position: 1, enteredStageAt: now(), updatedAt: now(), deletedAt: null }] });
  await assert.rejects(() => service.deleteStage('pipe-1', 'stage-1', user), /Mova os cards/);
  const existing = await service.ensureDefaultPipeline('org-1', user.id);
  assert.equal(existing.id, 'pipe-1');
  assert.equal(state.pipelines.length, 1);
});
