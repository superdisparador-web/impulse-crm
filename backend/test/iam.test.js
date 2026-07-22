const assert = require('node:assert/strict');
const test = require('node:test');
const { ForbiddenException } = require('@nestjs/common');
const { PermissionsGuard } = require('../dist/src/auth/guards/permissions.guard');
const { IamService, STABLE_PERMISSIONS } = require('../dist/src/iam/iam.service');

test('stable permissions catalog includes organization user role permissions', () => {
  assert.ok(STABLE_PERMISSIONS.includes('organizations:create'));
  assert.ok(STABLE_PERMISSIONS.includes('users:reset-password'));
  assert.ok(STABLE_PERMISSIONS.includes('roles:manage'));
});

test('PermissionsGuard allows and denies using IAM service instead of hardcoded guard map', async () => {
  const reflector = { getAllAndOverride: () => ['users:read'] };
  const iam = { permissionsForUser: async (userId) => userId === 'allowed' ? ['users:read'] : ['organizations:read'] };
  const guard = new PermissionsGuard(reflector, iam);
  const context = (id) => ({ getHandler: () => null, getClass: () => null, switchToHttp: () => ({ getRequest: () => ({ user: { id } }) }) });
  assert.equal(await guard.canActivate(context('allowed')), true);
  await assert.rejects(() => guard.canActivate(context('denied')), ForbiddenException);
});

test('IamService resolves permissions from role-permission records before legacy fallback', async () => {
  const prisma = {
    user: { findFirst: async () => ({ role: 'CORRETOR', organizationId: 'org-1', userRoles: [{ role: { permissions: [{ permission: { code: 'users:update' } }] } }] }) },
  };
  const service = new IamService(prisma);
  assert.deepEqual(await service.permissionsForUser('user-1'), ['users:update']);
});

const fs = require('node:fs');
const path = require('node:path');

test('RBAC hardening migration seeds permissions roles migrates legacy users and enforces partial unique indexes', () => {
  const sql = fs.readFileSync(path.join(__dirname, '../prisma/migrations/20260722020000_harden_rbac_multitenancy/migration.sql'), 'utf8');
  assert.match(sql, /RbacRole_global_code_key/);
  assert.match(sql, /Organization_slug_lower_active_key/);
  assert.match(sql, /INSERT INTO "Permission"/);
  assert.match(sql, /INSERT INTO "UserRole"/);
});

test('status hardening migration prevents invalid active and archived combinations', () => {
  const sql = fs.readFileSync(path.join(__dirname, '../prisma/migrations/20260722020000_harden_rbac_multitenancy/migration.sql'), 'utf8');
  assert.match(sql, /Organization_status_active_consistency/);
  assert.match(sql, /User_status_active_consistency/);
});
