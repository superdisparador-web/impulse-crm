import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: ['*'],
  CORRETOR: ['auth:session:read', 'auth:password:change'],
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
    if (!required?.length) return true;
    const request = context.switchToHttp().getRequest<{ user?: { role?: Role } }>();
    const permissions = request.user?.role ? ROLE_PERMISSIONS[request.user.role] ?? [] : [];
    if (permissions.includes('*') || required.every((p) => permissions.includes(p))) return true;
    throw new ForbiddenException('Permissão insuficiente');
  }
}
