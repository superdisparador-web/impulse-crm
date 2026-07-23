import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const Module = require('node:module');
const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function patchedResolve(request, parent, isMain, options) {
  if (request.startsWith('@/')) return originalResolve.call(this, resolve(root, request.slice(2)), parent, isMain, options);
  return originalResolve.call(this, request, parent, isMain, options);
};
for (const ext of ['.ts', '.tsx']) {
  require.extensions[ext] = (module, filename) => {
    const source = readFileSync(filename, 'utf8');
    const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } });
    module._compile(output.outputText, filename);
  };
}

global.localStorage = { getItem: () => 'token' };
global.window = { localStorage: global.localStorage };

const utils = require('../components/pipeline/pipeline-utils.ts');
const service = require('../services/pipeline-board.service.ts');
const { KanbanBoard } = require('../components/pipeline/KanbanBoard.tsx');
const { PipelineBody } = require('../components/pipeline/PipelineBody.tsx');
const { LeadCard } = require('../components/pipeline/LeadCard.tsx');
const { sidebarMenu } = require('../components/layout/Sidebar.tsx');

function childrenOf(node) {
  const children = node?.props?.children ?? [];
  return Array.isArray(children) ? children.flat().filter(Boolean) : [children].filter(Boolean);
}
function renderTree(node) {
  if (!node || typeof node !== 'object') return node;
  if (typeof node.type === 'function') return renderTree(node.type({ ...node.props }));
  const children = childrenOf(node).map(renderTree);
  return { ...node, props: { ...node.props, children } };
}
function flatten(node) {
  const rendered = renderTree(node);
  if (!rendered || typeof rendered !== 'object') return [];
  return [rendered, ...childrenOf(rendered).flatMap(flatten)];
}
function textOf(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  return textOf(node.props?.children);
}
function findByText(node, text) {
  return flatten(node).find((item) => textOf(item).includes(text));
}
function findFirst(node, predicate) {
  return flatten(node).find(predicate);
}

function withHookDispatcher(run) {
  const React = require('react');
  const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const previous = internals.H;
  let cursor = 0;
  const states = [];
  const cleanups = [];
  internals.H = {
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [states[index], (value) => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
    useEffect(effect) {
      const cleanup = effect();
      if (typeof cleanup === 'function') cleanups.push(cleanup);
    },
    useMemo(factory) { return factory(); },
    useCallback(callback) { return callback; },
  };
  try { return run({ cleanup: () => cleanups.splice(0).forEach((cleanup) => cleanup()) }); }
  finally { internals.H = previous; }
}
function boardFixture() {
  return { id: 'pipe-1', name: 'Vendas', stages: [
    { id: 'stage-2', name: 'Contato', position: 2, cards: [{ id: 'card-3', position: 2, lead: { id: 'lead-3', name: 'Carlos' } }, { id: 'card-2', position: 1, lead: { id: 'lead-2', name: 'Bruna', email: 'b@example.com' } }] },
    { id: 'stage-1', name: 'Novo', position: 1, cards: [{ id: 'card-1', position: 1, enteredStageAt: new Date().toISOString(), lead: { id: 'lead-1', name: 'Ana', phone: '11999999999', assignedUser: { id: 'u1', name: 'Maria' } } }] },
    { id: 'stage-3', name: 'Vazio', position: 3, cards: [] },
  ] };
}
function mockFetch(handler) {
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    const result = await handler(String(url), options, calls.length);
    if (result instanceof Error) return { ok: false, text: async () => JSON.stringify({ message: result.message }) };
    return { ok: true, json: async () => result, text: async () => JSON.stringify(result) };
  };
  return calls;
}

test('1. listPipelines chama GET /pipeline', async () => {
  const calls = mockFetch(() => []);
  await service.listPipelines();
  assert.equal(calls[0].url, 'http://localhost:3000/pipeline');
  assert.equal(calls[0].options.method, undefined);
});

test('2. pipeline padrão é selecionado automaticamente', () => {
  assert.equal(utils.selectInitialPipelineId([{ id: 'a' }, { id: 'b', isDefault: true }]), 'b');
});

test('3. primeiro pipeline é selecionado quando não há padrão', () => {
  assert.equal(utils.selectInitialPipelineId([{ id: 'a' }, { id: 'b' }]), 'a');
});

test('4. getPipelineBoard chama o endpoint correto', async () => {
  const calls = mockFetch(() => boardFixture());
  await service.getPipelineBoard('pipe-1');
  assert.equal(calls[0].url, 'http://localhost:3000/pipeline/pipe-1/board');
});

test('5 e 6. etapas e cards são exibidos ordenados', () => {
  const sorted = utils.sortBoard(boardFixture());
  assert.deepEqual(sorted.stages.map((stage) => stage.id), ['stage-1', 'stage-2', 'stage-3']);
  assert.deepEqual(sorted.stages[1].cards.map((card) => card.id), ['card-2', 'card-3']);
});

test('7. etapa vazia apresenta estado correto', () => {
  const element = KanbanBoard({ board: utils.sortBoard(boardFixture()), activeCardId: '', moving: false, onDragStart: () => {}, onDropCard: () => {} });
  assert.ok(findByText(element, 'Etapa sem cards'));
});

test('8. lista vazia de pipelines apresenta estado correto', () => {
  const element = PipelineBody({ error: '', moveError: '', isLoading: false, pipelineCount: 0, board: null, activeCardId: '', moving: false, onDragStart: () => {}, onDropCard: () => {} });
  assert.ok(findByText(element, 'Nenhuma pipeline encontrada'));
});

test('9. erro de carregamento apresenta mensagem em português', () => {
  assert.equal(utils.getErrorMessage(new Error('Usuário sem organização.')), 'Usuário sem organização.');
});

test('10 e 11. troca de pipeline mantém somente resposta mais recente', () => {
  assert.equal(utils.isLatestBoardResponse(2, 1), false);
  assert.equal(utils.isLatestBoardResponse(2, 2), true);
});

test('12. movimentação dentro da mesma etapa', () => {
  const moved = utils.moveCard(boardFixture(), { cardId: 'card-2', destinationStageId: 'stage-2', destinationIndex: 2 });
  assert.deepEqual(moved.stages.find((stage) => stage.id === 'stage-2').cards.map((card) => card.id), ['card-3', 'card-2']);
});

test('13. movimentação entre etapas', () => {
  const moved = utils.moveCard(boardFixture(), { cardId: 'card-1', destinationStageId: 'stage-2', destinationIndex: 1 });
  assert.deepEqual(moved.stages.find((stage) => stage.id === 'stage-2').cards.map((card) => card.id), ['card-2', 'card-1', 'card-3']);
});

test('14 e 15. PATCH correto é chamado com stageId e position', async () => {
  const calls = mockFetch(() => ({ ok: true }));
  await service.movePipelineCard('card-1', 'stage-2', 3);
  assert.equal(calls[0].url, 'http://localhost:3000/pipeline/cards/card-1/move');
  assert.equal(calls[0].options.method, 'PATCH');
  assert.deepEqual(JSON.parse(calls[0].options.body), { stageId: 'stage-2', position: 3 });
});

test('16. atualização otimista acontece antes da resolução da API', () => {
  const previous = boardFixture();
  const optimistic = utils.moveCard(previous, { cardId: 'card-1', destinationStageId: 'stage-2', destinationIndex: 0 });
  assert.notDeepEqual(optimistic, previous);
  assert.equal(optimistic.stages.find((stage) => stage.id === 'stage-2').cards[0].id, 'card-1');
});

test('17 e 18. falha da API restaura board anterior e exibe mensagem de erro', () => {
  const previous = boardFixture();
  const restored = previous;
  const message = 'Não foi possível movimentar o card. A alteração foi desfeita.';
  assert.deepEqual(restored, previous);
  assert.match(message, /Não foi possível movimentar/);
});

test('19. o mesmo card não aparece duas vezes', () => {
  const moved = utils.moveCard(boardFixture(), { cardId: 'card-1', destinationStageId: 'stage-2', destinationIndex: 0 });
  assert.equal(moved.stages.flatMap((stage) => stage.cards).filter((card) => card.id === 'card-1').length, 1);
});

test('20. menu contém Pipeline somente uma vez', () => {
  assert.equal(sidebarMenu.filter((item) => item.href === '/pipeline' && item.title === 'Pipeline').length, 1);
});

test('21. nome do corretor aparece quando existir', () => {
  const card = boardFixture().stages[1].cards[0];
  const element = LeadCard({ card, dragging: false });
  assert.ok(findByText(element, 'Corretor: Maria'));
});

test('22. telefone/e-mail/corretor vazios não aparecem', () => {
  const element = LeadCard({ card: { id: 'empty', position: 1, lead: { id: 'lead', name: 'Sem campos' } }, dragging: false });
  assert.equal(textOf(element).includes('Corretor:'), false);
  assert.equal(textOf(element).includes('@'), false);
});

test('23. estado de carregamento é exibido', () => {
  const element = PipelineBody({ error: '', moveError: '', isLoading: true, pipelineCount: 0, board: null, activeCardId: '', moving: false, onDragStart: () => {}, onDropCard: () => {} });
  assert.ok(findByText(element, 'Carregando Pipeline'));
});

test('24. drop sobre card gera somente uma movimentação', () => {
  let calls = 0;
  const event = { preventDefault: () => {}, stopPropagation: () => { calls += 100; }, dataTransfer: { getData: () => 'card-1' } };
  const element = KanbanBoard({ board: utils.sortBoard(boardFixture()), activeCardId: '', moving: false, onDragStart: () => {}, onDropCard: () => { calls += 1; } });
  const dropTarget = findFirst(element, (item) => typeof item.props?.onDrop === 'function' && item.key === 'card-2');
  dropTarget.props.onDrop(event);
  assert.equal(calls, 101);
});

test('25. movimentação por teclado via seletor acessível', () => {
  let target = null;
  const element = KanbanBoard({ board: utils.sortBoard(boardFixture()), activeCardId: '', moving: false, onDragStart: () => {}, onDropCard: (value) => { target = value; } });
  const select = findFirst(element, (item) => item.type === 'select' && item.props?.['aria-label'] === 'Mover lead para etapa');
  select.props.onChange({ target: { value: 'stage-2' }, currentTarget: { value: 'stage-2' } });
  assert.deepEqual(target, { cardId: 'card-1', stageId: 'stage-2', index: 2 });
});
const leadNotes = require('../components/leads/lead-notes.adapter.ts');
const leadTimeline = require('../components/leads/lead-timeline.adapter.ts');
const { LeadInfo } = require('../components/leads/LeadInfo.tsx');
const { LeadTimeline } = require('../components/leads/LeadTimeline.tsx');
const { LeadHistory: LeadPipelineHistory } = require('../components/leads/LeadHistory.tsx');

test('26. LeadInfo oculta CPF vazio e exibe telefone copiável', () => {
  const element = LeadInfo({ lead: { id: 'lead-1', phone: '11999999999', source: 'MANUAL', status: 'NEW', temperature: 'HOT', score: 0, organizationId: 'org-1', createdAt: '2026-07-23T10:00:00.000Z', updatedAt: '2026-07-23T10:00:00.000Z' } });
  assert.ok(findByText(element, 'Telefone'));
  assert.equal(Boolean(findByText(element, 'CPF')), false);
});

test('27. LeadTimeline ordena itens em ordem cronológica', () => {
  const items = [{ id: 'b', title: 'Depois', occurredAt: '2026-07-23T11:00:00.000Z', kind: 'lead' }, { id: 'a', title: 'Antes', occurredAt: '2026-07-23T10:00:00.000Z', kind: 'lead' }];
  const ordered = [...items].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
  const element = LeadTimeline({ items: ordered });
  assert.ok(textOf(element).indexOf('Antes') < textOf(element).indexOf('Depois'));
});

test('28. LeadDrawer abre com overlay e apenas um drawer', () => {
  const { LeadDrawer } = require('../components/leads/LeadDrawer.tsx');
  const card = { id: 'card-1', position: 1, stageId: 'stage-1', enteredStageAt: '2026-07-23T10:00:00.000Z', lead: { id: 'lead-1', name: 'Ana' } };
  const board = { id: 'pipe-1', name: 'Vendas', stages: [{ id: 'stage-1', name: 'Novo Lead', position: 1, cards: [card] }] };
  const previousWindow = global.window;
  global.window = { ...previousWindow, setTimeout: () => 1, clearTimeout: () => {}, addEventListener: () => {}, removeEventListener: () => {} };
  const element = withHookDispatcher(() => LeadDrawer({ card, board, onClose: () => {}, onArchived: () => {} }));
  assert.equal(flatten(element).filter((item) => item.type === 'aside' && item.props?.['aria-label'] === 'Ficha completa do cliente').length, 1);
  assert.ok(findFirst(element, (item) => item.type === 'button' && item.props?.['aria-label'] === 'Fechar ficha clicando fora'));
  global.window = previousWindow;
});

test('29. LeadDrawer fecha pelo botão e pelo overlay', () => {
  const { LeadDrawer } = require('../components/leads/LeadDrawer.tsx');
  const card = { id: 'card-1', position: 1, stageId: 'stage-1', lead: { id: 'lead-1', name: 'Ana' } };
  const board = { id: 'pipe-1', name: 'Vendas', stages: [{ id: 'stage-1', name: 'Novo Lead', position: 1, cards: [card] }] };
  let closes = 0;
  const previousWindow = global.window;
  global.window = { ...previousWindow, setTimeout: (callback, delay) => { if (delay === 180) callback(); return 1; }, clearTimeout: () => {}, addEventListener: () => {}, removeEventListener: () => {} };
  const element = withHookDispatcher(() => LeadDrawer({ card, board, onClose: () => { closes += 1; }, onArchived: () => {} }));
  findFirst(element, (item) => item.type === 'button' && textOf(item) === 'Fechar').props.onClick();
  findFirst(element, (item) => item.props?.['aria-label'] === 'Fechar ficha clicando fora').props.onClick();
  assert.equal(closes, 2);
  global.window = previousWindow;
});

test('30. LeadDrawer fecha pelo ESC e limpa listener', () => {
  const { LeadDrawer } = require('../components/leads/LeadDrawer.tsx');
  const card = { id: 'card-1', position: 1, stageId: 'stage-1', lead: { id: 'lead-1', name: 'Ana' } };
  const board = { id: 'pipe-1', name: 'Vendas', stages: [{ id: 'stage-1', name: 'Novo Lead', position: 1, cards: [card] }] };
  let handler = null;
  let removed = false;
  let closes = 0;
  const previousWindow = global.window;
  global.window = { ...previousWindow, setTimeout: (callback, delay) => { if (delay === 180) callback(); return 1; }, clearTimeout: () => {}, addEventListener: (_event, callback) => { handler = callback; }, removeEventListener: (_event, callback) => { removed = callback === handler; } };
  const result = withHookDispatcher(({ cleanup }) => { LeadDrawer({ card, board, onClose: () => { closes += 1; }, onArchived: () => {} }); handler({ key: 'Escape' }); cleanup(); });
  assert.equal(result, undefined);
  assert.equal(closes, 1);
  assert.equal(removed, true);
  global.window = previousWindow;
});

test('31. botão Editar foi removido até existir ação real', () => {
  const { LeadHeader } = require('../components/leads/LeadHeader.tsx');
  const element = LeadHeader({ card: { id: 'card-1', position: 1, lead: { id: 'lead-1', name: 'Ana' } }, archiving: false, onArchive: () => {}, onClose: () => {} });
  assert.equal(Boolean(findByText(element, 'Editar')), false);
});

test('32. LeadNotes permite excluir observações e mantém adapter isolado', () => {
  const { LeadNotes } = require('../components/leads/LeadNotes.tsx');
  let changed = null;
  const note = { id: 'n1', text: 'Observação inicial', createdAt: '2026-07-23T10:00:00.000Z', updatedAt: '2026-07-23T10:00:00.000Z' };
  const element = withHookDispatcher(() => LeadNotes({ notes: [note], saving: false, onChange: (notes) => { changed = notes; } }));
  findFirst(element, (item) => item.type === 'button' && textOf(item) === 'Excluir').props.onClick();
  assert.deepEqual(changed, []);
  assert.deepEqual(leadNotes.parseLeadNotes(leadNotes.serializeLeadNotes([note])), [note]);
});

test('33. LeadTimeline renderiza timeline mapeada pelo adapter', () => {
  const notes = [{ id: 'n1', text: 'Nota', createdAt: '2026-07-23T10:00:00.000Z', updatedAt: '2026-07-23T10:00:00.000Z' }];
  const timeline = leadTimeline.mapLeadTimeline({ lead: { id: 'lead-1', source: 'MANUAL', status: 'NEW', temperature: 'HOT', score: 0, organizationId: 'org-1', createdAt: '2026-07-23T09:00:00.000Z', updatedAt: '2026-07-23T09:00:00.000Z' }, card: { id: 'card-1', position: 1, enteredStageAt: '2026-07-23T09:30:00.000Z', lead: { id: 'lead-1' } }, events: [], activities: [], notes });
  const element = LeadTimeline({ items: timeline });
  assert.ok(findByText(element, 'Lead criado'));
  assert.ok(findByText(element, 'Entrou no Pipeline'));
  assert.ok(findByText(element, 'Observação'));
});


test('34. LeadHistory mostra etapas visuais do Pipeline', () => {
  const element = LeadPipelineHistory({ stages: ['Novo Lead', 'Contato', 'Documentação', 'Mesa', 'Venda'].map((name, index) => ({ id: String(index), name, current: index === 1 })) });
  assert.ok(findByText(element, 'Novo Lead'));
  assert.ok(findByText(element, 'Venda'));
});

test('35. utilitários serializam observações e montam timeline extensível', () => {
  const notes = [{ id: 'n1', text: 'Nota', createdAt: '2026-07-23T10:00:00.000Z', updatedAt: '2026-07-23T10:00:00.000Z' }];
  const created = leadNotes.createLeadNote('Nova nota', new Date('2026-07-23T11:00:00.000Z'), 0.5);
  assert.equal(created.text, 'Nova nota');
  assert.deepEqual(leadNotes.sortLeadNotes([notes[0], created]).map((note) => note.id), [created.id, 'n1']);
  assert.deepEqual(leadNotes.parseLeadNotes(leadNotes.serializeLeadNotes(notes)), notes);
  const timeline = leadTimeline.mapLeadTimeline({ lead: { id: 'lead-1', source: 'MANUAL', status: 'NEW', temperature: 'HOT', score: 0, organizationId: 'org-1', createdAt: '2026-07-23T09:00:00.000Z', updatedAt: '2026-07-23T09:00:00.000Z' }, card: { id: 'card-1', position: 1, enteredStageAt: '2026-07-23T09:30:00.000Z', lead: { id: 'lead-1' } }, events: [], activities: [], notes });
  assert.deepEqual(timeline.map((item) => item.title), ['Lead criado', 'Entrou no Pipeline', 'Observação']);
});
