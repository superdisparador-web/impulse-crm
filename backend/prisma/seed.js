const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const permissions = [
  'organizations:create',
  'organizations:read',
  'organizations:update',
  'organizations:suspend',
  'organizations:archive',
  'users:create',
  'users:read',
  'users:update',
  'users:activate',
  'users:deactivate',
  'users:archive',
  'users:reset-password',
  'roles:read',
  'roles:manage',
  'auth:session:read',
  'auth:password:change',
  'leads:create',
  'leads:read',
  'leads:read-all',
  'leads:update',
  'leads:assign',
  'leads:unassign',
  'leads:archive',
  'leads:restore',
  'leads:manage-duplicates',
  'leads:history:read',
  'whatsapp:accounts:create',
  'whatsapp:accounts:read',
  'whatsapp:accounts:update',
  'whatsapp:accounts:archive',
  'whatsapp:accounts:test',
  'whatsapp:conversations:read',
  'whatsapp:conversations:read-all',
  'whatsapp:conversations:update',
  'whatsapp:conversations:assign',
  'whatsapp:messages:read',
  'whatsapp:messages:send',
  'whatsapp:templates:read',
  'whatsapp:templates:create',
  'whatsapp:templates:update',
  'whatsapp:templates:sync',
  'whatsapp:templates:manage',
  'analytics.dashboard.read',
  'analytics.campaign.read',
  'analytics.broker.read',
  'analytics.manager.read',
  'analytics.whatsapp.read',
  'analytics.event.create',
  'distribution.list.create',
  'distribution.list.read',
  'distribution.list.update',
  'distribution.list.delete',
  'distribution.list.import',
  'distribution.member.manage',
  'distribution.assignment.read',
  'distribution.assignment.retry',
];

const roles = [
  {
    id: 'role_global_admin',
    code: 'GLOBAL_ADMIN',
    name: 'Administrador Global',
    description: 'Acesso total ao sistema',
  },
  {
    id: 'role_org_admin',
    code: 'ORG_ADMIN',
    name: 'Administrador da Organização',
    description: 'Administra uma organização',
  },
  {
    id: 'role_manager',
    code: 'MANAGER',
    name: 'Gerente',
    description: 'Gerencia equipe e operações',
  },
  {
    id: 'role_broker',
    code: 'BROKER',
    name: 'Corretor',
    description: 'Acesso operacional do corretor',
  },
];

const authPermissions = ['auth:session:read', 'auth:password:change'];

const rolePermissionCodes = {
  ORG_ADMIN: [
    'organizations:read',
    'organizations:update',
    'users:create',
    'users:read',
    'users:update',
    'users:activate',
    'users:deactivate',
    'users:archive',
    'users:reset-password',
    'roles:read',
    'leads:create',
    'leads:read',
    'leads:read-all',
    'leads:update',
    'leads:assign',
    'leads:unassign',
    'leads:archive',
    'leads:restore',
    'leads:manage-duplicates',
    'leads:history:read',
    'whatsapp:accounts:create',
    'whatsapp:accounts:read',
    'whatsapp:accounts:update',
    'whatsapp:accounts:archive',
    'whatsapp:accounts:test',
    'whatsapp:conversations:read',
    'whatsapp:conversations:read-all',
    'whatsapp:conversations:update',
    'whatsapp:conversations:assign',
    'whatsapp:messages:read',
    'whatsapp:messages:send',
    'whatsapp:templates:read',
    'whatsapp:templates:create',
    'whatsapp:templates:update',
    'whatsapp:templates:sync',
    'whatsapp:templates:manage',
    'analytics.dashboard.read',
    'analytics.campaign.read',
    'analytics.broker.read',
    'analytics.manager.read',
    'analytics.whatsapp.read',
    'analytics.event.create',
    'distribution.list.create',
    'distribution.list.read',
    'distribution.list.update',
    'distribution.list.delete',
    'distribution.list.import',
    'distribution.member.manage',
    'distribution.assignment.read',
    'distribution.assignment.retry',
  ],
  MANAGER: [
    'organizations:read',
    'users:create',
    'users:read',
    'users:update',
    'users:activate',
    'users:deactivate',
    'leads:create',
    'leads:read',
    'leads:read-all',
    'leads:update',
    'leads:assign',
    'leads:unassign',
    'leads:archive',
    'leads:manage-duplicates',
    'leads:history:read',
    'whatsapp:accounts:read',
    'whatsapp:conversations:read',
    'whatsapp:conversations:read-all',
    'whatsapp:conversations:update',
    'whatsapp:conversations:assign',
    'whatsapp:messages:read',
    'whatsapp:messages:send',
    'whatsapp:templates:read',
    'analytics.dashboard.read',
    'analytics.campaign.read',
    'analytics.broker.read',
    'analytics.manager.read',
    'analytics.whatsapp.read',
    'distribution.list.create',
    'distribution.list.read',
    'distribution.list.update',
    'distribution.list.import',
    'distribution.member.manage',
    'distribution.assignment.read',
    'distribution.assignment.retry',
  ],
  BROKER: [
    'organizations:read',
    'users:read',
    'leads:create',
    'leads:read',
    'leads:update',
    'leads:history:read',
    'whatsapp:conversations:read',
    'whatsapp:conversations:update',
    'whatsapp:messages:read',
    'whatsapp:messages:send',
    'analytics.dashboard.read',
    'analytics.broker.read',
    'distribution.list.read',
    'distribution.assignment.read',
  ],
};

async function main() {
  for (const code of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }

  const rolesByCode = new Map();

  for (const role of roles) {
    const existingRole = await prisma.rbacRole.findFirst({
      where: { organizationId: null, code: role.code },
      select: { id: true },
    });
    const persistedRole = await prisma.rbacRole.upsert({
      where: { id: existingRole?.id ?? role.id },
      update: {
        name: role.name,
        description: role.description,
        system: true,
        deletedAt: null,
      },
      create: {
        id: role.id,
        organizationId: null,
        code: role.code,
        name: role.name,
        description: role.description,
        system: true,
      },
    });
    rolesByCode.set(role.code, persistedRole);
  }

  const allPermissions = await prisma.permission.findMany({
    select: { id: true, code: true },
  });
  const permissionsByCode = new Map(allPermissions.map((permission) => [permission.code, permission]));

  for (const role of roles) {
    const desiredPermissions = role.code === 'GLOBAL_ADMIN'
      ? allPermissions
      : [...authPermissions, ...rolePermissionCodes[role.code]].map((code) => permissionsByCode.get(code));
    const persistedRole = rolesByCode.get(role.code);

    if (!persistedRole) throw new Error(`Papel ${role.code} não encontrado após a sincronização.`);
    if (desiredPermissions.some((permission) => !permission)) {
      throw new Error(`Permissão do papel ${role.code} não encontrada.`);
    }

    const desiredPermissionIds = desiredPermissions.map((permission) => permission.id);

    await prisma.rolePermission.deleteMany({
      where: {
        roleId: persistedRole.id,
        permissionId: { notIn: desiredPermissionIds },
      },
    });

    for (const permission of desiredPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: persistedRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: persistedRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  const globalAdminRole = await prisma.rbacRole.findFirst({
    where: {
      organizationId: null,
      code: 'GLOBAL_ADMIN',
      deletedAt: null,
    },
  });

  if (!globalAdminRole) throw new Error('Papel GLOBAL_ADMIN não encontrado.');

  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'admin@impulsecrm.com' },
    update: {
      name: 'Administrador',
      password: passwordHash,
      role: 'GLOBAL_ADMIN',
      active: true,
      status: 'ACTIVE',
    },
    create: {
      name: 'Administrador',
      email: 'admin@impulsecrm.com',
      password: passwordHash,
      role: 'GLOBAL_ADMIN',
      active: true,
      status: 'ACTIVE',
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: globalAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: globalAdminRole.id,
    },
  });

  console.log('Papéis e permissões sincronizados com sucesso.');
  console.log('Administrador de desenvolvimento criado ou atualizado com sucesso.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
