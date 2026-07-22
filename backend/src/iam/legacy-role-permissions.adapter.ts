import { Role } from '@prisma/client';

/**
 * Temporary compatibility adapter for users created before table-backed RBAC.
 * Remove after all legacy Role enum values have been migrated into UserRole rows.
 */
export class LegacyRolePermissionsAdapter {
  permissionsFor(role: Role, global: boolean): string[] {
    if (global && (role === Role.ADMIN || role === Role.GLOBAL_ADMIN)) return ['*'];
    if (role === Role.ADMIN || role === Role.ORG_ADMIN) return ['organizations:read', 'organizations:update', 'users:create', 'users:read', 'users:update', 'users:activate', 'users:deactivate', 'users:archive', 'users:reset-password', 'roles:read', 'auth:session:read', 'auth:password:change'];
    if (role === Role.MANAGER) return ['organizations:read', 'users:create', 'users:read', 'users:update', 'users:activate', 'users:deactivate', 'auth:session:read', 'auth:password:change'];
    return ['organizations:read', 'users:read', 'auth:session:read', 'auth:password:change'];
  }

  roleCodeFor(role: Role, global: boolean): string {
    if (global && (role === Role.ADMIN || role === Role.GLOBAL_ADMIN)) return 'GLOBAL_ADMIN';
    if (role === Role.ADMIN || role === Role.ORG_ADMIN) return 'ORG_ADMIN';
    if (role === Role.MANAGER) return 'MANAGER';
    return 'BROKER';
  }
}
