const assert = require('node:assert/strict');
const test = require('node:test');
const { MODULE_METADATA } = require('@nestjs/common/constants');
const { CampaignsModule } = require('../dist/src/campaigns/campaigns.module');
const { AnalyticsModule } = require('../dist/src/analytics/analytics.module');
const { AuthModule } = require('../dist/src/auth/auth.module');
const { DistributionModule } = require('../dist/src/distribution/distribution.module');
const { IamModule } = require('../dist/src/iam/iam.module');
const { IamService } = require('../dist/src/iam/iam.service');
const { LeadsModule } = require('../dist/src/leads/leads.module');
const { OrganizationsModule } = require('../dist/src/organizations/organizations.module');
const { PermissionsGuard } = require('../dist/src/auth/guards/permissions.guard');
const { UsersModule } = require('../dist/src/users/users.module');
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
  const iamConsumers = [
    AnalyticsModule,
    CampaignsModule,
    DistributionModule,
    LeadsModule,
    OrganizationsModule,
    UsersModule,
    WhatsappModule,
  ];

  for (const featureModule of iamConsumers) {
    assert.ok(metadata(featureModule, MODULE_METADATA.IMPORTS).includes(IamModule));
    assert.ok(!metadata(featureModule, MODULE_METADATA.PROVIDERS).includes(IamService));
    assert.ok(!metadata(featureModule, MODULE_METADATA.PROVIDERS).includes(PermissionsGuard));
  }

  assert.ok(!metadata(AuthModule, MODULE_METADATA.PROVIDERS).includes(IamService));
  assert.ok(!metadata(AuthModule, MODULE_METADATA.PROVIDERS).includes(PermissionsGuard));
});
