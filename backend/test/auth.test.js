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

test('PermissionsGuard allows admin wildcard and denies missing permissions', () => {
  const reflector = { getAllAndOverride: () => ['auth:password:change'] };
  const makeContext = (role) => ({ getHandler: () => null, getClass: () => null, switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }) });
  const guard = new PermissionsGuard(reflector);
  assert.equal(guard.canActivate(makeContext('ADMIN')), true);
  assert.equal(guard.canActivate(makeContext('CORRETOR')), true);
  reflector.getAllAndOverride = () => ['admin:only'];
  assert.throws(() => guard.canActivate(makeContext('CORRETOR')));
});
