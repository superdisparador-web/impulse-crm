import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LegacyRolePermissionsAdapter } from './legacy-role-permissions.adapter';

export const STABLE_PERMISSIONS = [
  'organizations:create', 'organizations:read', 'organizations:update', 'organizations:suspend', 'organizations:archive',
  'users:create', 'users:read', 'users:update', 'users:activate', 'users:deactivate', 'users:archive', 'users:reset-password',
  'roles:read', 'roles:manage', 'auth:session:read', 'auth:password:change',
] as const;

@Injectable()
export class IamService {
  private readonly legacy = new LegacyRolePermissionsAdapter();

  constructor(private readonly prisma: PrismaService) {}

  async permissionsForUser(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, status: 'ACTIVE', deletedAt: null },
      select: { role: true, organizationId: true, userRoles: { where: { role: { deletedAt: null } }, select: { role: { select: { permissions: { select: { permission: { select: { code: true } } } } } } } } },
    });
    if (!user) return [];
    const dbPermissions = user.userRoles.flatMap((entry) => entry.role.permissions.map((permission) => permission.permission.code));
    if (dbPermissions.length) return [...new Set(dbPermissions)];
    return this.legacy.permissionsFor(user.role, user.organizationId === null);
  }

  async rolesForUser(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findFirst({ where: { id: userId, status: 'ACTIVE', deletedAt: null }, select: { role: true, organizationId: true, userRoles: { where: { role: { deletedAt: null } }, select: { role: { select: { code: true } } } } } });
    if (!user) return [];
    const roles = user.userRoles.map((entry) => entry.role.code);
    return roles.length ? roles : [this.legacy.roleCodeFor(user.role, user.organizationId === null)];
  }

  async listRoles() {
    return this.prisma.rbacRole.findMany({ where: { deletedAt: null }, include: { permissions: { include: { permission: true } } }, orderBy: [{ organizationId: 'asc' }, { code: 'asc' }] });
  }

  async listPermissions() {
    return this.prisma.permission.findMany({ orderBy: { code: 'asc' } });
  }

  async replaceUserRole(userId: string, role: Role, organizationId: string | null): Promise<void> {
    const code = this.legacy.roleCodeFor(role, organizationId === null);
    const rbacRole = await this.prisma.rbacRole.findFirst({ where: { code, organizationId: null, deletedAt: null }, select: { id: true } });
    if (!rbacRole) throw new NotFoundException(`Papel padrão não encontrado: ${code}`);
    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId } }),
      this.prisma.userRole.create({ data: { userId, roleId: rbacRole.id } }),
    ]);
  }
}
