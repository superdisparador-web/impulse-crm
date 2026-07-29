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
    code: 'GLOBAL_ADMIN',
    name: 'Administrador Global',
    description: 'Acesso total ao sistema',
  },
  {
    code: 'ORG_ADMIN',
    name: 'Administrador da Organização',
    description: 'Administra uma organização',
  },
  {
    code: 'MANAGER',
    name: 'Gerente',
    description: 'Gerencia equipe e operações',
  },
  {
    code: 'BROKER',
    name: 'Corretor',
    description: 'Acesso operacional do corretor',
  },
];

async function main() {
  for (const code of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }

  for (const role of roles) {
    const existingRole = await prisma.rbacRole.findFirst({ where: { organizationId: null, code: role.code } });
    if (existingRole) {
      await prisma.rbacRole.update({ where: { id: existingRole.id }, data: { name: role.name, description: role.description, system: true } });
    } else {
      await prisma.rbacRole.create({ data: {
        organizationId: null,
        code: role.code,
        name: role.name,
        description: role.description,
        system: true,
      } });
    }
  }

  const globalAdminRole = await prisma.rbacRole.findFirst({
    where: {
      code: 'GLOBAL_ADMIN',
      organizationId: null,
    },
  });

  const email = process.env.DEV_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.DEV_ADMIN_PASSWORD;
  let user = email ? await prisma.user.findUnique({ where: { email } }) : null;

  if (email || password) {
    if (process.env.NODE_ENV === 'production') throw new Error('O seed de administrador local não pode rodar em produção.');
    if (!email || !password || password.length < 8) throw new Error('Defina DEV_ADMIN_EMAIL e DEV_ADMIN_PASSWORD (mínimo de 8 caracteres).');
    const passwordHash = await bcrypt.hash(password, 12);
    user = await prisma.user.upsert({
      where: { email },
      update: { active: true, deletedAt: null },
      create: { name: process.env.DEV_ADMIN_NAME?.trim() || 'Administrador local', email, password: passwordHash, role: 'ADMIN' },
    });
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
