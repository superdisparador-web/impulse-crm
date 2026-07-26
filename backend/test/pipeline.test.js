const assert = require('node:assert/strict');
const { test } = require('node:test');
const { PipelineService } = require('../dist/src/pipeline/pipeline.service');
const { MoveCardDto, PipelineBoardQueryDto } = require('../dist/src/pipeline/dto/pipeline.dto');
const { validate } = require('class-validator');

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
    events: [],
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
  const visibleCard = (card, where = {}) => {
    const lead = state.leads.find(item => item.id === card.leadId);
    const filter = where.lead;
    if (card.deletedAt !== null || !lead) return false;
    if (!filter) return true;
    if (lead.deletedAt !== null || lead.archivedAt != null) return false;
    for (const key of ['assignedUserId', 'managerUserId', 'status', 'temperature', 'source']) if (filter[key] && lead[key] !== filter[key]) return false;
    return true;
  };
  let lock = Promise.resolve();
  const tx = {
    $queryRaw: async () => {},
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
    leadEvent: { create: async ({ data }) => { if (seed.failEvent) throw new Error('timeline unavailable'); const row = { id: `event-${seq++}`, createdAt: now(), ...data }; state.events.push(row); return row; } },
    pipelineLead: {
      findUnique: async ({ where }) => state.cards.find(row => row.id === where.id) ?? null,
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
      findMany: async ({ where, orderBy, include }) => order(state.stages.filter(row => match(row, where)).map(stage => include?.cards ? { ...stage, cards: order(state.cards.filter(card => card.stageId === stage.id && visibleCard(card, include.cards.where)), include.cards.orderBy).map(card => includeCard(card, include.cards.include)) } : stage), orderBy),
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
    $transaction: (callback) => { const run = lock.then(async () => { const snapshot = { cards: structuredClone(state.cards), events: structuredClone(state.events), stages: structuredClone(state.stages) }; try { return await callback(tx); } catch (error) { state.cards.splice(0, state.cards.length, ...snapshot.cards); state.events.splice(0, state.events.length, ...snapshot.events); state.stages.splice(0, state.stages.length, ...snapshot.stages); throw error; } }); lock = run.catch(() => undefined); return run; },
  };
  const service = new PipelineService(prisma, { resolve: async () => ({ id: seed.context?.id ?? 'user-1', role: seed.context?.role ?? 'ADMIN', global: seed.context?.global ?? false, organizationId: seed.context?.organizationId ?? 'org-1' }) }, { record: async payload => state.audits.push(payload) }, { emit: async payload => state.analytics.push(payload) });
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

test('default real-estate pipeline creates the twelve commercial stages only once', async () => {
  const { service, state } = createHarness();
  await service.ensureDefaultPipeline('org-1', user.id);
  await service.ensureDefaultPipeline('org-1', user.id);
  assert.deepEqual(state.stages.map(stage => stage.name), ['Novo', 'Primeiro contato', 'Interessado', 'Agendamento', 'Visita', 'Documentação', 'Análise bancária', 'Aprovação', 'Reserva', 'Contrato', 'Venda', 'Perdido']);
  assert.equal(state.pipelines.length, 1);
});

test('board enforces tenant, broker and manager scopes and hides archived or deleted leads', async () => {
  const seed = { context: { id: 'broker-1', role: 'BROKER' }, pipelines: [{ id: 'pipe-1', organizationId: 'org-1', name: 'Vendas', active: true, deletedAt: null }], stages: [{ id: 'stage-1', organizationId: 'org-1', pipelineId: 'pipe-1', name: 'Novo', position: 1, active: true, deletedAt: null }], leads: [
    { id: 'mine', organizationId: 'org-1', name: 'Meu', assignedUserId: 'broker-1', managerUserId: 'manager-1', metadata: {}, deletedAt: null, archivedAt: null },
    { id: 'other', organizationId: 'org-1', name: 'Outro', assignedUserId: 'broker-2', managerUserId: 'manager-2', metadata: {}, deletedAt: null, archivedAt: null },
    { id: 'archived', organizationId: 'org-1', name: 'Arquivado', assignedUserId: 'broker-1', metadata: {}, deletedAt: null, archivedAt: now() },
    { id: 'deleted', organizationId: 'org-1', name: 'Excluído', assignedUserId: 'broker-1', metadata: {}, deletedAt: now(), archivedAt: null },
  ], cards: ['mine', 'other', 'archived', 'deleted'].map((leadId, index) => ({ id: `card-${leadId}`, organizationId: 'org-1', pipelineId: 'pipe-1', stageId: 'stage-1', leadId, position: index + 1, enteredStageAt: now(), updatedAt: now(), deletedAt: null })) };
  const broker = createHarness(seed);
  assert.deepEqual((await broker.service.board('pipe-1', { id: 'broker-1', role: 'BROKER' })).stages[0].cards.map(card => card.lead.id), ['mine']);
  const manager = createHarness({ ...seed, context: { id: 'manager-1', role: 'MANAGER' } });
  assert.deepEqual((await manager.service.board('pipe-1', { id: 'manager-1', role: 'MANAGER' })).stages[0].cards.map(card => card.lead.id), ['mine']);
});

test('move permissions allow organization admin and reject another broker or manager team', async () => {
  const base = { pipelines: [{ id: 'pipe-1', organizationId: 'org-1', name: 'Vendas', active: true, deletedAt: null }], stages: [{ id: 'stage-1', organizationId: 'org-1', pipelineId: 'pipe-1', name: 'Novo', position: 1, active: true, deletedAt: null }, { id: 'stage-2', organizationId: 'org-1', pipelineId: 'pipe-1', name: 'Venda', position: 2, active: true, deletedAt: null }], leads: [{ id: 'lead-1', organizationId: 'org-1', assignedUserId: 'broker-1', managerUserId: 'manager-1', metadata: {}, deletedAt: null }], cards: [{ id: 'card-1', organizationId: 'org-1', pipelineId: 'pipe-1', stageId: 'stage-1', leadId: 'lead-1', position: 1, enteredStageAt: now(), updatedAt: now(), deletedAt: null }] };
  const broker = createHarness({ ...base, context: { id: 'broker-2', role: 'BROKER' } });
  await assert.rejects(() => broker.service.moveCard('card-1', { stageId: 'stage-2', position: 1 }, { id: 'broker-2', role: 'BROKER' }), /próprios leads/);
  const manager = createHarness({ ...base, context: { id: 'manager-2', role: 'MANAGER' } });
  await assert.rejects(() => manager.service.moveCard('card-1', { stageId: 'stage-2', position: 1 }, { id: 'manager-2', role: 'MANAGER' }), /própria equipe/);
  const admin = createHarness(base);
  assert.equal((await admin.service.moveCard('card-1', { stageId: 'stage-2', position: 1 }, user)).stageId, 'stage-2');
});

test('move rejects a stage from another pipeline and persists immutable timeline details once', async () => {
  const harness = createHarness({ pipelines: [{ id: 'pipe-1', organizationId: 'org-1', name: 'A', active: true, deletedAt: null }, { id: 'pipe-2', organizationId: 'org-1', name: 'B', active: true, deletedAt: null }], stages: [{ id: 'stage-1', organizationId: 'org-1', pipelineId: 'pipe-1', name: 'Novo', position: 1, active: true, deletedAt: null }, { id: 'stage-2', organizationId: 'org-1', pipelineId: 'pipe-1', name: 'Venda', position: 2, active: true, deletedAt: null }, { id: 'foreign', organizationId: 'org-1', pipelineId: 'pipe-2', name: 'Outro', position: 1, active: true, deletedAt: null }], leads: [{ id: 'lead-1', organizationId: 'org-1', assignedUserId: null, managerUserId: null, metadata: {}, deletedAt: null }], cards: [{ id: 'card-1', organizationId: 'org-1', pipelineId: 'pipe-1', stageId: 'stage-1', leadId: 'lead-1', position: 1, enteredStageAt: now(), updatedAt: now(), deletedAt: null }] });
  await assert.rejects(() => harness.service.moveCard('card-1', { stageId: 'foreign', position: 1 }, user), /Etapa ativa não encontrada/);
  await harness.service.moveCard('card-1', { stageId: 'stage-2', position: 1, reason: 'Cliente enviou documentos' }, user);
  assert.equal(harness.state.events.length, 1);
  assert.deepEqual(harness.state.events[0].payload, { pipelineId: 'pipe-1', fromStageId: 'stage-1', toStageId: 'stage-2', reason: 'Cliente enviou documentos' });
  assert.equal(harness.state.analytics[0].eventType, 'LEAD_STAGE_CHANGED');
  await harness.service.moveCard('card-1', { stageId: 'stage-2', position: 1 }, user);
  assert.equal(harness.state.events.length, 1);
});

test('transaction rollback never leaves a moved card without its timeline event', async () => {
  const harness = createHarness({ failEvent: true, pipelines: [{ id: 'pipe-1', organizationId: 'org-1', name: 'A', active: true, deletedAt: null }], stages: [{ id: 'stage-1', organizationId: 'org-1', pipelineId: 'pipe-1', name: 'Novo', position: 1, active: true, deletedAt: null }, { id: 'stage-2', organizationId: 'org-1', pipelineId: 'pipe-1', name: 'Venda', position: 2, active: true, deletedAt: null }], leads: [{ id: 'lead-1', organizationId: 'org-1', metadata: {}, deletedAt: null }], cards: [{ id: 'card-1', organizationId: 'org-1', pipelineId: 'pipe-1', stageId: 'stage-1', leadId: 'lead-1', position: 1, enteredStageAt: now(), updatedAt: now(), deletedAt: null }] });
  await assert.rejects(() => harness.service.moveCard('card-1', { stageId: 'stage-2', position: 1 }, user), /timeline unavailable/);
  assert.equal(harness.state.cards[0].stageId, 'stage-1');
  assert.equal(harness.state.events.length, 0);
});

test('board combines property filters and computes full metrics before visual limit', async () => {
  const leads = Array.from({ length: 55 }, (_, index) => ({ id: `lead-${index}`, organizationId: 'org-1', name: `Lead ${index}`, status: 'QUALIFIED', temperature: 'HOT', source: 'CAMPAIGN', assignedUserId: null, managerUserId: null, metadata: { empreendimento: 'Parque Sul', regiao: 'Sul', bairro: 'Moema' }, deletedAt: null, archivedAt: null, leadDistributions: [] }));
  const cards = leads.map((lead, index) => ({ id: `card-${index}`, organizationId: 'org-1', pipelineId: 'pipe-1', stageId: 'stage-1', leadId: lead.id, position: index + 1, enteredStageAt: now(), updatedAt: now(), deletedAt: null }));
  const harness = createHarness({ pipelines: [{ id: 'pipe-1', organizationId: 'org-1', name: 'A', active: true, deletedAt: null }], stages: [{ id: 'stage-1', organizationId: 'org-1', pipelineId: 'pipe-1', name: 'Interessado', position: 1, active: true, deletedAt: null }], leads, cards });
  const board = await harness.service.board('pipe-1', user, { development: 'Parque', region: 'Sul', neighborhood: 'Moema', status: 'QUALIFIED', temperature: 'HOT', source: 'CAMPAIGN' });
  assert.equal(board.metrics.total, 55);
  assert.equal(board.stages[0].cards.length, 50);
  assert.equal(board.pagination.limit, 50);
  assert.equal((await harness.service.board('pipe-1', user, { limit: 100 })).stages[0].cards.length, 55);
});

test('existing default pipelines are synchronized additively and idempotently without moving cards', async () => {
  const harness = createHarness({ pipelines: [{ id: 'pipe-1', organizationId: 'org-1', name: 'Personalizado', active: true, isDefault: true, deletedAt: null }], stages: [{ id: 'legacy', organizationId: 'org-1', pipelineId: 'pipe-1', name: 'Novo Lead', position: 4, active: true, deletedAt: null }], cards: [{ id: 'card-1', organizationId: 'org-1', pipelineId: 'pipe-1', stageId: 'legacy', leadId: 'lead-1', position: 1, enteredStageAt: now(), updatedAt: now(), deletedAt: null }] });
  await harness.service.ensureDefaultPipeline('org-1', user.id);
  const firstNames = harness.state.stages.map(stage => stage.name);
  await harness.service.ensureDefaultPipeline('org-1', user.id);
  assert.deepEqual(harness.state.stages.map(stage => stage.name), firstNames);
  assert.equal(harness.state.stages.find(stage => stage.id === 'legacy').position, 4);
  assert.equal(harness.state.cards[0].stageId, 'legacy');
  assert.equal(new Set(firstNames).size, firstNames.length);
});



test('concurrent moves of the same card remain serialized with a consistent history chain', async () => {
  const harness = createHarness({ pipelines: [{ id: 'pipe-1', organizationId: 'org-1', name: 'A', active: true, deletedAt: null }], stages: [{ id: 'stage-1', organizationId: 'org-1', pipelineId: 'pipe-1', name: 'Novo', position: 1, active: true, deletedAt: null }, { id: 'stage-2', organizationId: 'org-1', pipelineId: 'pipe-1', name: 'Visita', position: 2, active: true, deletedAt: null }, { id: 'stage-3', organizationId: 'org-1', pipelineId: 'pipe-1', name: 'Venda', position: 3, active: true, deletedAt: null }], leads: [{ id: 'lead-1', organizationId: 'org-1', metadata: {}, assignedUserId: null, managerUserId: null, deletedAt: null }], cards: [{ id: 'card-1', organizationId: 'org-1', pipelineId: 'pipe-1', stageId: 'stage-1', leadId: 'lead-1', position: 1, enteredStageAt: now(), updatedAt: now(), deletedAt: null }] });
  await Promise.all([harness.service.moveCard('card-1', { stageId: 'stage-2', position: 1 }, user), harness.service.moveCard('card-1', { stageId: 'stage-3', position: 1 }, user)]);
  assert.equal(harness.state.cards.filter(card => card.id === 'card-1').length, 1);
  assert.equal(harness.state.cards[0].stageId, 'stage-3');
  assert.deepEqual(harness.state.events.map(event => [event.payload.fromStageId, event.payload.toStageId]), [['stage-1', 'stage-2'], ['stage-2', 'stage-3']]);
});

test('pipeline DTO rejects reasons above 500 chars and visual limits above 100', async () => {
  const moveErrors = await validate(Object.assign(new MoveCardDto(), { stageId: 'stage-1', position: 1, reason: 'x'.repeat(501) }));
  const limitErrors = await validate(Object.assign(new PipelineBoardQueryDto(), { limit: 101 }));
  assert.ok(moveErrors.some(error => error.property === 'reason'));
  assert.ok(limitErrors.some(error => error.property === 'limit'));
});
