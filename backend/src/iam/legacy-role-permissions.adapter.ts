import { Role } from '@prisma/client';

const AUTH_PERMISSIONS = ['auth:session:read', 'auth:password:change'];
const ORG_ADMIN_PERMISSIONS = ['organizations:read', 'organizations:update', 'users:create', 'users:read', 'users:update', 'users:activate', 'users:deactivate', 'users:archive', 'users:reset-password', 'roles:read'];
const MANAGER_PERMISSIONS = ['organizations:read', 'users:create', 'users:read', 'users:update', 'users:activate', 'users:deactivate'];
const BROKER_PERMISSIONS = ['organizations:read', 'users:read'];
const LEADS_ADMIN_PERMISSIONS = ['leads:create', 'leads:read', 'leads:read-all', 'leads:update', 'leads:assign', 'leads:unassign', 'leads:archive', 'leads:restore', 'leads:manage-duplicates', 'leads:history:read'];
const LEADS_MANAGER_PERMISSIONS = ['leads:create', 'leads:read', 'leads:read-all', 'leads:update', 'leads:assign', 'leads:unassign', 'leads:archive', 'leads:manage-duplicates', 'leads:history:read'];
const LEADS_BROKER_PERMISSIONS = ['leads:create', 'leads:read', 'leads:update', 'leads:history:read'];

/** Compatibility adapter for users created before table-backed RBAC. */
export class LegacyRolePermissionsAdapter {
  permissionsFor(role: Role, global: boolean): string[] {
    if (global && (role === Role.ADMIN || role === Role.GLOBAL_ADMIN)) return ['*'];
    if (role === Role.ADMIN || role === Role.ORG_ADMIN) return [...ORG_ADMIN_PERMISSIONS, ...AUTH_PERMISSIONS, ...LEADS_ADMIN_PERMISSIONS];
    if (role === Role.MANAGER) return [...MANAGER_PERMISSIONS, ...AUTH_PERMISSIONS, ...LEADS_MANAGER_PERMISSIONS];
    return [...BROKER_PERMISSIONS, ...AUTH_PERMISSIONS, ...LEADS_BROKER_PERMISSIONS];
  }

  roleCodeFor(role: Role, global: boolean): string {
    if (global && (role === Role.ADMIN || role === Role.GLOBAL_ADMIN)) return 'GLOBAL_ADMIN';
    if (role === Role.ADMIN || role === Role.ORG_ADMIN) return 'ORG_ADMIN';
    if (role === Role.MANAGER) return 'MANAGER';
    return 'BROKER';
  }
}
