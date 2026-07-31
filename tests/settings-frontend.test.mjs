import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../components/settings/SettingsCenter.tsx', import.meta.url), 'utf8');
const seed = readFileSync(new URL('../backend/prisma/seed.js', import.meta.url), 'utf8');

const permissionMapCodes = [...source
  .slice(source.indexOf('const PERMISSIONS'), source.indexOf('\n};', source.indexOf('const PERMISSIONS')))
  .matchAll(/^  '([^']+)':/gm)]
  .map((match) => match[1]);
const apiPermissionCodes = [...seed
  .slice(seed.indexOf('const permissions = ['), seed.indexOf('\n];', seed.indexOf('const permissions = [')))
  .matchAll(/'([^']+)'/g)]
  .map((match) => match[1]);

test('settings navigation keeps business names and restores Atendimento', () => {
  assert.match(source, /ORG_ADMIN: 'Superintendente'/);
  assert.match(source, /MANAGER: 'Gerente'/);
  assert.match(source, /BROKER: 'Corretor'/);
  assert.match(source, /id: 'operations', label: 'Atendimento'/);
  assert.match(source, /operations: settingsService\.operations/);
  assert.match(source, /submit=\{settingsService\.updateOperations\}/);
});

test('technical permission and notification names are translated before rendering', () => {
  assert.doesNotMatch(source, />\s*\{code\}\s*</);
  assert.doesNotMatch(source, />\s*\{item\.key\}\s*</);
  for (const label of ['Ver informações da própria conta', 'Receber notificações pelo aplicativo', 'Receber notificações por e-mail']) {
    assert.match(source, new RegExp(label));
  }
  assert.match(source, /PERMISSIONS\[code\] \?\? CUSTOM_PERMISSION/);
  assert.match(source, /title: 'Permissão personalizada'/);
  assert.match(source, /title: 'Notificação personalizada'/);
  assert.match(source, /ROLE_LABEL\[role\.code\] \?\? CUSTOM_ROLE_LABEL/);
  assert.doesNotMatch(source, /data\.businessLabels\[role\.code\]/);
});

test('permission map translates every unique code returned by the permission matrix', () => {
  assert.equal(new Set(apiPermissionCodes).size, 81);
  assert.equal(new Set(permissionMapCodes).size, permissionMapCodes.length);
  assert.deepEqual([...permissionMapCodes].sort(), [...new Set(apiPermissionCodes)].sort());
});

test('Empresa and Aparência have independent form identities and fields', () => {
  assert.match(source, /key="organization-settings"/);
  assert.match(source, /key="appearance-settings"/);
  const organization = source.slice(source.indexOf('function Organization'), source.indexOf('function Appearance'));
  const appearance = source.slice(source.indexOf('function Appearance'), source.indexOf('function Operations'));
  assert.match(organization, /legalName/);
  assert.doesNotMatch(appearance, /legalName/);
  assert.match(appearance, /primaryColor/);
  assert.doesNotMatch(organization, /primaryColor/);
  assert.match(organization, /settingsService\.updateOrganization/);
  assert.match(appearance, /settingsService\.updateBranding/);
});

test('integration cards use actual status and never mark errors available', () => {
  assert.match(source, /INTEGRATION_STATUS\[item\.status\]/);
  assert.match(source, /item\.status === 'error'/);
  assert.match(source, /error: 'Requer atenção'/);
  assert.match(source, /Situação não disponível/);
  assert.doesNotMatch(source, /Pronto para usar/);
});

test('system information has honest fallbacks and real controls remain saveable', () => {
  assert.match(source, /'Informação não disponível'/);
  for (const invented of ['Versão atual', 'Atualizado recentemente', 'Banco de dados funcionando normalmente', 'Servidor funcionando normalmente', 'Licença ativa', 'Backup protegido']) {
    assert.doesNotMatch(source, new RegExp(invented));
  }
  assert.match(source, /Pausar temporariamente o acesso/);
  assert.match(source, /Permitir personalização por empresa/);
  assert.match(source, /settingsService\.updateSystem\(form\)/);
});

test('security and errors do not promise unsupported features or expose technical failures', () => {
  assert.match(source, /title: 'Autenticação em dois fatores'.*status: 'Em breve'/);
  assert.match(source, /me\.authSessions\.length/);
  assert.match(source, /Não foi possível carregar esta área\. Tente novamente\./);
  assert.match(source, /Não foi possível salvar as alterações\. Tente novamente\./);
});

test('notification groups contain only supported preferences and omit empty placeholders', () => {
  for (const key of ['notifyInApp', 'notifyEmail', 'notifyWhatsapp', 'notifyNewLeads', 'notifySla', 'notifyCampaigns', 'notifySecurity']) assert.match(source, new RegExp(`key: '${key}'`));
  assert.doesNotMatch(source, /group: 'Sistema'/);
});

test('editable forms call their established frontend services', () => {
  for (const method of ['updateMe', 'updateOrganization', 'updateBranding', 'updateOperations', 'updateSecurity', 'updateNotifications', 'updateSystem']) {
    assert.match(source, new RegExp(`settingsService\\.${method}`));
  }
});
