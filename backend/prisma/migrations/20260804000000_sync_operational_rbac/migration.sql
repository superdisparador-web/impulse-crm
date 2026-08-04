-- Keep table-backed RBAC in sync with the operational modules introduced after
-- the initial IAM bootstrap. Without this migration, migrated users have a
-- non-empty (but incomplete) database role, so the legacy-role fallback is
-- intentionally not used and valid requests are denied.
WITH codes(code) AS (VALUES
  ('leads:create'), ('leads:read'), ('leads:read-all'), ('leads:update'),
  ('leads:assign'), ('leads:unassign'), ('leads:archive'), ('leads:restore'),
  ('leads:manage-duplicates'), ('leads:history:read'),
  ('whatsapp:accounts:create'), ('whatsapp:accounts:read'), ('whatsapp:accounts:update'),
  ('whatsapp:accounts:archive'), ('whatsapp:accounts:test'),
  ('whatsapp:conversations:read'), ('whatsapp:conversations:read-all'),
  ('whatsapp:conversations:update'), ('whatsapp:conversations:assign'),
  ('whatsapp:messages:read'), ('whatsapp:messages:send'),
  ('whatsapp:templates:read'), ('whatsapp:templates:create'),
  ('whatsapp:templates:update'), ('whatsapp:templates:sync'), ('whatsapp:templates:manage'),
  ('distribution.list.create'), ('distribution.list.read'), ('distribution.list.update'),
  ('distribution.list.delete'), ('distribution.list.import'), ('distribution.member.manage'),
  ('distribution.assignment.read'), ('distribution.assignment.retry'), ('distribution.report.export'),
  ('analytics.dashboard.read'), ('analytics.campaign.read'), ('analytics.broker.read'),
  ('analytics.manager.read'), ('analytics.whatsapp.read'), ('analytics.event.create'),
  ('analytics.rollup.manage'),
  ('campaigns:read'), ('campaigns:create'), ('campaigns:update'), ('campaigns:archive'), ('campaigns:cancel')
)
INSERT INTO "Permission" ("id", "code", "createdAt", "updatedAt")
SELECT 'perm_operational_' || md5(code), code, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM codes
ON CONFLICT ("code") DO NOTHING;

-- Global administrators receive the complete permission catalog.
INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "createdAt")
SELECT 'rp_sync_global_' || md5(p."id"), r."id", p."id", CURRENT_TIMESTAMP
FROM "RbacRole" r CROSS JOIN "Permission" p
WHERE r."organizationId" IS NULL AND r."code" = 'GLOBAL_ADMIN' AND r."deletedAt" IS NULL
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Organization administrators own all tenant-scoped operational capabilities.
INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "createdAt")
SELECT 'rp_sync_org_' || md5(p."id"), r."id", p."id", CURRENT_TIMESTAMP
FROM "RbacRole" r CROSS JOIN "Permission" p
WHERE r."organizationId" IS NULL AND r."code" = 'ORG_ADMIN' AND r."deletedAt" IS NULL
  AND (p."code" LIKE 'leads:%' OR p."code" LIKE 'whatsapp:%' OR p."code" LIKE 'distribution.%' OR p."code" LIKE 'analytics.%' OR p."code" LIKE 'campaigns:%')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Managers can operate teams, lead distribution and analytics, but not destructive
-- account/template administration or global rollups.
INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "createdAt")
SELECT 'rp_sync_manager_' || md5(p."id"), r."id", p."id", CURRENT_TIMESTAMP
FROM "RbacRole" r CROSS JOIN "Permission" p
WHERE r."organizationId" IS NULL AND r."code" = 'MANAGER' AND r."deletedAt" IS NULL
  AND p."code" IN (
    'leads:create','leads:read','leads:read-all','leads:update','leads:assign','leads:unassign','leads:archive','leads:manage-duplicates','leads:history:read',
    'whatsapp:accounts:read','whatsapp:conversations:read','whatsapp:conversations:read-all','whatsapp:conversations:update','whatsapp:conversations:assign','whatsapp:messages:read','whatsapp:messages:send','whatsapp:templates:read',
    'distribution.list.create','distribution.list.read','distribution.list.update','distribution.list.import','distribution.member.manage','distribution.assignment.read','distribution.assignment.retry',
    'analytics.dashboard.read','analytics.campaign.read','analytics.broker.read','analytics.manager.read','analytics.whatsapp.read',
    'campaigns:read','campaigns:create','campaigns:update','campaigns:archive','campaigns:cancel'
  )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Brokers retain the scoped day-to-day CRM capabilities represented by their
-- existing service-level access policies.
INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "createdAt")
SELECT 'rp_sync_broker_' || md5(p."id"), r."id", p."id", CURRENT_TIMESTAMP
FROM "RbacRole" r CROSS JOIN "Permission" p
WHERE r."organizationId" IS NULL AND r."code" = 'BROKER' AND r."deletedAt" IS NULL
  AND p."code" IN (
    'leads:create','leads:read','leads:update','leads:history:read',
    'whatsapp:conversations:read','whatsapp:conversations:update','whatsapp:messages:read','whatsapp:messages:send',
    'distribution.list.read','distribution.assignment.read','analytics.dashboard.read','analytics.broker.read','campaigns:read'
  )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
