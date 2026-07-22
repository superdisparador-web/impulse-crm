const assert = require('node:assert/strict');
const test = require('node:test');
const { BadRequestException } = require('@nestjs/common');
const { PasswordService } = require('../dist/src/auth/security/password.service');
const { PermissionsGuard } = require('../dist/src/auth/guards/permissions.guard');

test('PasswordService hashes new passwords with bcrypt prefix and verifies timing-safe hashes', async () => {
  const service = new PasswordService();
  const hash = await service.hash('Senha123');
  assert.ok(hash.startsWith('$2'));
  assert.equal(await service.verify(hash, 'Senha123'), true);
  assert.equal(await service.verify(hash, 'Senha124'), false);
});

test('PasswordService enforces minimum password policy', async () => {
  const service = new PasswordService();
  await assert.rejects(() => service.hash('weak'), BadRequestException);
});

test('PermissionsGuard requires IAM and denies missing permissions', async () => {
  const reflector = { getAllAndOverride: () => ['auth:password:change'] };
  const makeContext = (id) => ({ getHandler: () => null, getClass: () => null, switchToHttp: () => ({ getRequest: () => ({ user: { id } }) }) });
  const iam = { permissionsForUser: async (id) => id === 'allowed' ? ['auth:password:change'] : [] };
  const guard = new PermissionsGuard(reflector, iam);
  assert.equal(await guard.canActivate(makeContext('allowed')), true);
  await assert.rejects(() => guard.canActivate(makeContext('denied')));
});
