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
  'whatsapp:templates:sync',
  'whatsapp:templates:manage',
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
    'whatsapp:templates:sync',
    'whatsapp:templates:manage',
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
    const rolePermissionList = role.code === 'GLOBAL_ADMIN'
      ? allPermissions
      : [...authPermissions, ...rolePermissionCodes[role.code]].map((code) => permissionsByCode.get(code));

    for (const permission of rolePermissionList) {
      if (!permission) throw new Error(`Permissão do papel ${role.code} não encontrada.`);
      const persistedRole = rolesByCode.get(role.code);
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

  const globalAdminRole = rolesByCode.get('GLOBAL_ADMIN');

  const email = process.env.DEV_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.DEV_ADMIN_PASSWORD;
  let user = email ? await prisma.user.findUnique({ where: { email } }) : null;

  if (email || password) {
    if (process.env.NODE_ENV === 'production') throw new Error('O seed de administrador local não pode rodar em produção.');
    if (!email || !password || password.length < 6) throw new Error('Defina DEV_ADMIN_EMAIL e DEV_ADMIN_PASSWORD (mínimo de 6 caracteres).');
    const passwordHash = await bcrypt.hash(password, 12);
    user = await prisma.user.upsert({
      where: { email },
      update: {
        name: process.env.DEV_ADMIN_NAME?.trim() || 'Administrador local',
        password: passwordHash,
        role: 'GLOBAL_ADMIN',
        active: true,
        status: 'ACTIVE',
        deletedAt: null,
      },
      create: {
        name: process.env.DEV_ADMIN_NAME?.trim() || 'Administrador local',
        email,
        password: passwordHash,
        role: 'GLOBAL_ADMIN',
        active: true,
        status: 'ACTIVE',
      },
    });
    if (!(await bcrypt.compare(password, user.password))) throw new Error('Falha ao validar o hash bcrypt do administrador local.');
    console.log(`Administrador local disponível para ${email}.`);
  }

  if (globalAdminRole && user) {
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
  }

  console.log('Papéis e permissões sincronizados com sucesso.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
