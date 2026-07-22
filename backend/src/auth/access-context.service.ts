import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LegacyRolePermissionsAdapter } from '../iam/legacy-role-permissions.adapter';

export type AuthenticatedUserRef = { id: string; role?: Role | string };

export type AccessContext = {
  id: string;
  role: Role;
  roles: string[];
  permissions: string[];
  sessionId?: string;
  organizationId: string | null;
  global: boolean;
};

@Injectable()
export class AccessContextService {
  private readonly legacy = new LegacyRolePermissionsAdapter();

  constructor(private readonly prisma: PrismaService) {}

  async resolve(user?: AuthenticatedUserRef, options: { allowSystem?: boolean } = {}): Promise<AccessContext> {
    if (!user?.id) {
      if (options.allowSystem) return { id: 'system', role: Role.ADMIN, roles: ['ADMIN'], permissions: ['*'], organizationId: null, global: true };
      throw new ForbiddenException('Usuário não autenticado');
    }

    const actor = await this.prisma.user.findFirst({
      where: { id: user.id, status: 'ACTIVE', deletedAt: null },
      select: { id: true, role: true, organizationId: true, organization: { select: { status: true, active: true, deletedAt: true } }, userRoles: { where: { role: { deletedAt: null } }, select: { role: { select: { code: true, permissions: { select: { permission: { select: { code: true } } } } } } } } },
    });

    if (!actor) throw new ForbiddenException('Usuário sem acesso ativo');

    const global = actor.role === Role.ADMIN && actor.organizationId === null;
    if (!global && (!actor.organizationId || (actor.organization?.status ?? (actor.organization?.active ? 'ACTIVE' : undefined)) !== 'ACTIVE' || actor.organization?.deletedAt)) {
      throw new ForbiddenException('Usuário sem organização ativa');
    }

    const roles = (actor.userRoles ?? []).map((entry) => entry.role.code);
    const permissions = (actor.userRoles ?? []).flatMap((entry) => entry.role.permissions.map((permission) => permission.permission.code));
    return { id: actor.id, role: actor.role, roles: roles.length ? roles : [this.legacy.roleCodeFor(actor.role, global)], permissions: permissions.length ? [...new Set(permissions)] : this.legacy.permissionsFor(actor.role, global), organizationId: actor.organizationId, global };
  }
}
