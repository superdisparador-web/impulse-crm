-- Harden slug uniqueness and RBAC bootstrap without mutating data at API startup.
DROP INDEX IF EXISTS "Organization_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Organization_slug_lower_active_key" ON "Organization" (lower("slug")) WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "RbacRole_global_code_key" ON "RbacRole" ("code") WHERE "organizationId" IS NULL AND "deletedAt" IS NULL;
DROP INDEX IF EXISTS "RbacRole_organizationId_code_key";
CREATE UNIQUE INDEX IF NOT EXISTS "RbacRole_tenant_code_key" ON "RbacRole" ("organizationId", "code") WHERE "organizationId" IS NOT NULL AND "deletedAt" IS NULL;

ALTER TABLE "Organization" ADD CONSTRAINT "Organization_status_active_consistency" CHECK (("status" = 'ACTIVE' AND "active" = true AND "deletedAt" IS NULL) OR ("status" IN ('INACTIVE', 'SUSPENDED') AND "active" = false AND "deletedAt" IS NULL) OR ("status" = 'ARCHIVED' AND "active" = false AND "deletedAt" IS NOT NULL));
ALTER TABLE "User" ADD CONSTRAINT "User_status_active_consistency" CHECK (("status" = 'ACTIVE' AND "active" = true AND "deletedAt" IS NULL) OR ("status" = 'INACTIVE' AND "active" = false AND "deletedAt" IS NULL) OR ("status" = 'ARCHIVED' AND "active" = false AND "deletedAt" IS NOT NULL));

INSERT INTO "Permission" ("id", "code", "createdAt", "updatedAt") VALUES
  ('perm_organizations_create', 'organizations:create', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_organizations_read', 'organizations:read', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_organizations_update', 'organizations:update', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_organizations_suspend', 'organizations:suspend', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_organizations_archive', 'organizations:archive', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_users_create', 'users:create', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_users_read', 'users:read', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_users_update', 'users:update', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_users_activate', 'users:activate', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_users_deactivate', 'users:deactivate', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_users_archive', 'users:archive', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_users_reset_password', 'users:reset-password', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_roles_read', 'roles:read', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_roles_manage', 'roles:manage', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_auth_session_read', 'auth:session:read', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perm_auth_password_change', 'auth:password:change', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "RbacRole" ("id", "organizationId", "code", "name", "description", "system", "createdAt", "updatedAt") VALUES
  ('role_global_admin', NULL, 'GLOBAL_ADMIN', 'Global Administrator', 'Platform-wide administrator', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('role_org_admin', NULL, 'ORG_ADMIN', 'Organization Administrator', 'Organization-scoped administrator', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('role_manager', NULL, 'MANAGER', 'Manager', 'Organization-scoped manager', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('role_broker', NULL, 'BROKER', 'Broker', 'Organization-scoped broker', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "createdAt")
SELECT 'rp_global_' || p."id", 'role_global_admin', p."id", CURRENT_TIMESTAMP FROM "Permission" p
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "createdAt")
SELECT 'rp_org_' || p."id", 'role_org_admin', p."id", CURRENT_TIMESTAMP FROM "Permission" p WHERE p."code" IN ('organizations:read','organizations:update','users:create','users:read','users:update','users:activate','users:deactivate','users:archive','users:reset-password','roles:read','auth:session:read','auth:password:change')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "createdAt")
SELECT 'rp_manager_' || p."id", 'role_manager', p."id", CURRENT_TIMESTAMP FROM "Permission" p WHERE p."code" IN ('organizations:read','users:create','users:read','users:update','users:activate','users:deactivate','auth:session:read','auth:password:change')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "createdAt")
SELECT 'rp_broker_' || p."id", 'role_broker', p."id", CURRENT_TIMESTAMP FROM "Permission" p WHERE p."code" IN ('organizations:read','users:read','auth:session:read','auth:password:change')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO "UserRole" ("id", "userId", "roleId", "createdAt")
SELECT 'ur_' || u."id" || '_' || CASE WHEN u."organizationId" IS NULL AND u."role" IN ('ADMIN','GLOBAL_ADMIN') THEN 'global_admin' WHEN u."role" IN ('ADMIN','ORG_ADMIN') THEN 'org_admin' WHEN u."role" = 'MANAGER' THEN 'manager' ELSE 'broker' END,
       u."id",
       CASE WHEN u."organizationId" IS NULL AND u."role" IN ('ADMIN','GLOBAL_ADMIN') THEN 'role_global_admin' WHEN u."role" IN ('ADMIN','ORG_ADMIN') THEN 'role_org_admin' WHEN u."role" = 'MANAGER' THEN 'role_manager' ELSE 'role_broker' END,
       CURRENT_TIMESTAMP
FROM "User" u
WHERE u."deletedAt" IS NULL
ON CONFLICT ("userId", "roleId") DO NOTHING;
