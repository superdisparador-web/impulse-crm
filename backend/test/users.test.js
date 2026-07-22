const test = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');

const { BadRequestException, ConflictException, ForbiddenException, NotFoundException } = require('@nestjs/common');
const { Role } = require('@prisma/client');
const { UsersController } = require('../dist/src/users/users.controller');
const { UsersService } = require('../dist/src/users/users.service');
const { AccessContextService } = require('../dist/src/auth/access-context.service');
const { JwtAuthGuard } = require('../dist/src/auth/jwt-auth.guard');
const { RolesGuard } = require('../dist/src/auth/roles/roles.guard');

const globalAdmin = { id: 'global-admin', role: Role.ADMIN };
const orgAdmin = { id: 'org-admin', role: Role.ADMIN };
const commonUser = { id: 'common-user', role: Role.CORRETOR };

function user(id, role = Role.CORRETOR, organizationId = 'org-1') { return { id, name: id, email: `${id}@example.com`, phone: null, role, active: true, organizationId, organization: organizationId ? { id: organizationId, name: organizationId, active: true, deletedAt: null } : null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null }; }

function makePrisma() {
  const state = { listWhere: null, created: null, updated: null };
  const users = { 'global-admin': user('global-admin', Role.ADMIN, null), 'org-admin': user('org-admin', Role.ADMIN, 'org-1'), 'common-user': user('common-user', Role.CORRETOR, 'org-1'), 'other-user': user('other-user', Role.CORRETOR, 'org-2') };
  const prisma = {
    user: {
      findMany: async (args) => { state.listWhere = args.where; return Object.values(users).filter((u) => !args.where.organizationId || u.organizationId === args.where.organizationId); },
      count: async () => 1,
      findFirst: async (args) => {
        if (args.where.email) return args.where.email.equals === 'duplicado@example.com' ? user('dup') : null;
        const found = users[args.where.id] || null;
        if (!found) return null;
        if (args.where.role && found.role !== args.where.role) return null;
        if (args.where.organizationId !== undefined && found.organizationId !== args.where.organizationId) return null;
        return found;
      },
      create: async (args) => { state.created = args; return { id: 'new-user', ...args.data, password: undefined, organization: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null }; },
      update: async (args) => { state.updated = args; return { ...users[args.where.id], ...args.data }; },
    },
    organization: { findFirst: async (args) => args.where.id === 'missing' ? null : { id: args.where.id, active: true } },
    $transaction: async (items) => Promise.all(items),
    __state: state,
  };
  return prisma;
}

test('protects user routes with JWT, RolesGuard and ADMIN metadata', () => {
  assert.ok((Reflect.getMetadata('__guards__', UsersController) || []).includes(JwtAuthGuard));
  for (const name of ['findAll', 'create', 'update', 'updateStatus', 'resetPassword', 'remove']) {
    assert.ok((Reflect.getMetadata('__guards__', UsersController.prototype[name]) || []).includes(RolesGuard));
    assert.deepEqual(Reflect.getMetadata('roles', UsersController.prototype[name]), [Role.ADMIN]);
  }
});



test('RolesGuard is generic and does not branch by users route', async () => {
  const prisma = makePrisma();
  const reflector = { getAllAndOverride: () => [Role.ADMIN] };
  const guard = new RolesGuard(reflector, prisma);
  const context = {
    getHandler: () => function handler() {},
    getClass: () => function Controller() {},
    switchToHttp: () => ({ getRequest: () => ({ user: { id: 'org-admin', role: Role.ADMIN }, route: { path: '/any-module' } }) }),
  };
  assert.equal(await guard.canActivate(context), true);
});

test('global admin lists all users and can filter by organization', async () => {
  const prisma = makePrisma();
  await new UsersService(prisma, new AccessContextService(prisma)).findAll({ organizationId: 'org-2' }, globalAdmin);
  assert.equal(prisma.__state.listWhere.organizationId, 'org-2');
});

test('org admin listing is scoped to own tenant and ignores frontend organizationId', async () => {
  const prisma = makePrisma();
  await new UsersService(prisma, new AccessContextService(prisma)).findAll({ organizationId: 'org-2' }, orgAdmin);
  assert.equal(prisma.__state.listWhere.organizationId, 'org-1');
});

test('common user can read own profile only', async () => {
  const service = new UsersService(makePrisma(), new AccessContextService(makePrisma()));
  assert.equal((await service.findOne('common-user', commonUser)).id, 'common-user');
  await assert.rejects(() => service.findOne('other-user', commonUser), NotFoundException);
});

test('common user cannot manage users', async () => {
  await assert.rejects(() => new UsersService(makePrisma(), new AccessContextService(makePrisma())).create({ name: 'X', email: 'x@example.com', password: 'Senha123' }, commonUser), ForbiddenException);
});

test('creates org user from authenticated org and normalizes email', async () => {
  const prisma = makePrisma();
  await new UsersService(prisma, new AccessContextService(prisma)).create({ name: ' New ', email: 'NEW@EXAMPLE.COM', password: 'Senha123', role: Role.ADMIN, organizationId: 'org-2' }, orgAdmin);
  assert.equal(prisma.__state.created.data.email, 'new@example.com');
  assert.equal(prisma.__state.created.data.organizationId, 'org-1');
  assert.equal(prisma.__state.created.data.role, Role.CORRETOR);
});

test('rejects duplicated email and empty name', async () => {
  const service = new UsersService(makePrisma(), new AccessContextService(makePrisma()));
  await assert.rejects(() => service.create({ name: 'X', email: 'duplicado@example.com', password: 'Senha123' }, orgAdmin), ConflictException);
  await assert.rejects(() => service.create({ name: '   ', email: 'ok@example.com', password: 'Senha123' }, orgAdmin), BadRequestException);
});

test('blocks privilege escalation and cross-tenant updates', async () => {
  const service = new UsersService(makePrisma(), new AccessContextService(makePrisma()));
  await assert.rejects(() => service.update('common-user', { role: Role.ADMIN }, orgAdmin), ForbiddenException);
  await assert.rejects(() => service.update('other-user', { name: 'Hack' }, orgAdmin), NotFoundException);
});

test('soft deletes and resets password administratively', async () => {
  const prisma = makePrisma();
  const service = new UsersService(prisma, new AccessContextService(prisma));
  assert.deepEqual(await service.remove('common-user', orgAdmin), { success: true });
  assert.equal(prisma.__state.updated.data.active, false);
  assert.ok(prisma.__state.updated.data.deletedAt);
  await service.resetPassword('common-user', 'Senha123', orgAdmin);
  assert.ok(prisma.__state.updated.data.password.startsWith('$2'));
});
