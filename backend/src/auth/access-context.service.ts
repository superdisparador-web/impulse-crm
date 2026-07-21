import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type AuthenticatedUserRef = { id: string; role?: Role | string };

export type AccessContext = {
  id: string;
  role: Role;
  organizationId: string | null;
  global: boolean;
};

@Injectable()
export class AccessContextService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(user?: AuthenticatedUserRef, options: { allowSystem?: boolean } = {}): Promise<AccessContext> {
    if (!user?.id) {
      if (options.allowSystem) return { id: 'system', role: Role.ADMIN, organizationId: null, global: true };
      throw new ForbiddenException('Usuário não autenticado');
    }

    const actor = await this.prisma.user.findFirst({
      where: { id: user.id, active: true, deletedAt: null },
      select: { id: true, role: true, organizationId: true, organization: { select: { active: true, deletedAt: true } } },
    });

    if (!actor) throw new ForbiddenException('Usuário sem acesso ativo');

    const global = actor.role === Role.ADMIN && actor.organizationId === null;
    if (!global && (!actor.organizationId || !actor.organization?.active || actor.organization.deletedAt)) {
      throw new ForbiddenException('Usuário sem organização ativa');
    }

    return { id: actor.id, role: actor.role, organizationId: actor.organizationId, global };
  }
}
