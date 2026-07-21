const test = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');

const { ConflictException, ForbiddenException, NotFoundException, BadRequestException } = require('@nestjs/common');
const { Role } = require('@prisma/client');
const { OrganizationsController } = require('../dist/src/organizations/organizations.controller');
const { OrganizationsService } = require('../dist/src/organizations/organizations.service');
const { JwtAuthGuard } = require('../dist/src/auth/jwt-auth.guard');
const { RolesGuard } = require('../dist/src/auth/roles/roles.guard');

const globalUser = { id: 'global-admin', role: Role.ADMIN };
const commonUser = { id: 'common-user', role: Role.CORRETOR };

function makePrisma(overrides = {}) {
  const state = { created: null, updated: null, listWhere: null, oneWhere: null, txCalls: [] };
  const prisma = {
    organization: {
      create: async (args) => { state.created = args; return { id: 'org-new', ...args.data }; },
      findMany: async (args) => { state.listWhere = args.where; return [{ id: args.where.id || 'org-1', name: 'Org' }]; },
      count: async () => 1,
      findFirst: async (args) => {
        if (args.select?.document || args.select?.email) return null;
        state.oneWhere = args.where;
        return { id: args.where.id || 'org-1', name: 'Org' };
      },
      update: async (args) => { state.updated = args; return { id: args.where.id, ...args.data }; },
    },
    user: { count: async () => 0, findFirst: async (args) => userForArgs(args) },
    lead: { count: async () => 0 },
    whatsappAccount: { count: async () => 0 },
    whatsappTemplate: { count: async () => 0 },
    campaign: { count: async () => 0 },
    messageQueue: { count: async () => 0 },
    $transaction: async (arg) => {
      if (Array.isArray(arg)) return Promise.all(arg);
      return arg({ organization: prisma.organization });
    },
    __state: state,
  };
  function userForArgs(args) {
    if (args.where.id === globalUser.id && (args.where.role === undefined || args.where.role === Role.ADMIN) && (args.where.organizationId === undefined || args.where.organizationId === null)) return { id: globalUser.id, role: Role.ADMIN, organizationId: null, organization: null };
    if (args.where.id === commonUser.id && args.where.role === undefined && args.where.organizationId === undefined) return { id: commonUser.id, role: Role.CORRETOR, organizationId: 'org-owned', organization: { active: true, deletedAt: null } };
    return null;
  }
  return Object.assign(prisma, overrides);
}

test('protects organization routes with JwtAuthGuard and mutation roles guard', () => {
  const classGuards = Reflect.getMetadata('__guards__', OrganizationsController) || [];
  assert.ok(classGuards.includes(JwtAuthGuard), 'class must require JWT');
  for (const name of ['create', 'update', 'updateStatus', 'remove']) {
    const handler = OrganizationsController.prototype[name];
    const guards = Reflect.getMetadata('__guards__', handler) || [];
    const roles = Reflect.getMetadata('roles', handler) || [];
    assert.ok(guards.includes(RolesGuard), `${name} must use RolesGuard`);
    assert.deepEqual(roles, [Role.ADMIN], `${name} must require ADMIN role`);
  }
});

test('creates organization as global admin and normalizes document phone email', async () => {
  const prisma = makePrisma();
  const service = new OrganizationsService(prisma);
  await service.create({ name: ' Org ', document: '12.345/0001-99', phone: '(11) 99999-0000', email: 'UP@EXAMPLE.COM' }, globalUser);
  assert.equal(prisma.__state.created.data.name, 'Org');
  assert.equal(prisma.__state.created.data.document, '12345000199');
  assert.equal(prisma.__state.created.data.phone, '11999990000');
  assert.equal(prisma.__state.created.data.email, 'up@example.com');
});

test('rejects empty name after trim', async () => {
  const service = new OrganizationsService(makePrisma());
  await assert.rejects(() => service.create({ name: '   ' }, globalUser), BadRequestException);
});

test('updates optional fields without nulling omitted values', async () => {
  const prisma = makePrisma();
  const service = new OrganizationsService(prisma);
  await service.update('org-1', { phone: '(21) 3333-4444' }, globalUser);
  assert.deepEqual(prisma.__state.updated.data, { phone: '2133334444' });
});

test('rejects duplicated document', async () => {
  const prisma = makePrisma({ organization: { ...makePrisma().organization, findFirst: async (args) => args.select?.document ? { document: '123', email: null } : { id: args.where.id || 'org' } } });
  const service = new OrganizationsService(prisma);
  await assert.rejects(() => service.create({ name: 'Org', document: '123' }, globalUser), ConflictException);
});

test('rejects duplicated email', async () => {
  const prisma = makePrisma({ organization: { ...makePrisma().organization, findFirst: async (args) => args.select?.email ? { document: null, email: 'used@example.com' } : { id: args.where.id || 'org' } } });
  const service = new OrganizationsService(prisma);
  await assert.rejects(() => service.create({ name: 'Org', email: 'USED@example.com' }, globalUser), ConflictException);
});

test('lists all organizations for global admin and filters active status', async () => {
  const prisma = makePrisma();
  const service = new OrganizationsService(prisma);
  const result = await service.findAll({ active: false, page: 1, limit: 10 }, globalUser);
  assert.equal(result.meta.total, 1);
  assert.equal(prisma.__state.listWhere.active, false);
  assert.equal(prisma.__state.listWhere.id, undefined);
});

test('limits common user listing to own organization', async () => {
  const prisma = makePrisma();
  const service = new OrganizationsService(prisma);
  await service.findAll({}, commonUser);
  assert.equal(prisma.__state.listWhere.id, 'org-owned');
});

test('allows global admin to access any organization', async () => {
  const prisma = makePrisma();
  const service = new OrganizationsService(prisma);
  await service.findOne('org-any', globalUser);
  assert.deepEqual(prisma.__state.oneWhere, { id: 'org-any', deletedAt: null });
});

test('returns not found on cross-tenant access attempt', async () => {
  const prisma = makePrisma();
  prisma.organization.findFirst = async (args) => {
    prisma.__state.oneWhere = args.where;
    return null;
  };
  const service = new OrganizationsService(prisma);
  await assert.rejects(() => service.findOne('other-org', commonUser), NotFoundException);
  assert.equal(prisma.__state.oneWhere.id, 'org-owned');
});

test('rejects mutation with non-global role', async () => {
  const service = new OrganizationsService(makePrisma());
  await assert.rejects(() => service.update('org-owned', { name: 'X' }, commonUser), ForbiddenException);
});

test('soft deletes organization transactionally', async () => {
  const prisma = makePrisma();
  const service = new OrganizationsService(prisma);
  const result = await service.remove('org-empty', globalUser);
  assert.deepEqual(result, { success: true });
  assert.equal(prisma.__state.updated.where.id, 'org-empty');
  assert.equal(primaUndefined(prisma.__state.updated.data.deletedAt), false);
  assert.equal(prisma.__state.updated.data.active, false);
});

function primaUndefined(value) { return value === undefined; }

test('blocks delete when active operational links exist', async () => {
  const prisma = makePrisma();
  prisma.lead.count = async () => 2;
  const service = new OrganizationsService(prisma);
  await assert.rejects(() => service.remove('org-linked', globalUser), ConflictException);
});
