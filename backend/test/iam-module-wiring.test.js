const assert = require('node:assert/strict');
const test = require('node:test');
const { MODULE_METADATA } = require('@nestjs/common/constants');
const { CampaignsModule } = require('../dist/src/campaigns/campaigns.module');
const { IamModule } = require('../dist/src/iam/iam.module');
const { IamService } = require('../dist/src/iam/iam.service');
const { PermissionsGuard } = require('../dist/src/auth/guards/permissions.guard');
const { WhatsappModule } = require('../dist/src/whatsapp/whatsapp.module');

function metadata(module, key) {
  return Reflect.getMetadata(key, module) || [];
}

test('IamModule owns and exports the IAM singleton and permissions guard', () => {
  const providers = metadata(IamModule, MODULE_METADATA.PROVIDERS);
  const exports = metadata(IamModule, MODULE_METADATA.EXPORTS);

  assert.equal(providers.filter((provider) => provider === IamService).length, 1);
  assert.equal(providers.filter((provider) => provider === PermissionsGuard).length, 1);
  assert.ok(exports.includes(IamService));
  assert.ok(exports.includes(PermissionsGuard));
});

test('feature modules using PermissionsGuard import IamModule without redeclaring IAM providers', () => {
  for (const featureModule of [CampaignsModule, WhatsappModule]) {
    assert.ok(metadata(featureModule, MODULE_METADATA.IMPORTS).includes(IamModule));
    assert.ok(!metadata(featureModule, MODULE_METADATA.PROVIDERS).includes(IamService));
    assert.ok(!metadata(featureModule, MODULE_METADATA.PROVIDERS).includes(PermissionsGuard));
  }
});
