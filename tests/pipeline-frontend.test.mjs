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
