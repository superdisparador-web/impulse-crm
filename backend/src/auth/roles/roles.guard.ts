import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from './roles.decorator';

interface AuthRequest { user?: { id: string; role: Role } }

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!roles?.length) return true;
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const userId = request.user?.id;
    if (!userId) throw new ForbiddenException('Usuário não autenticado');
    const user = await this.prisma.user.findFirst({ where: { id: userId, active: true, deletedAt: null }, select: { role: true, organizationId: true } });
    if (!user || !roles.includes(user.role)) throw new ForbiddenException('Permissão insuficiente');
    return true;
  }
}
