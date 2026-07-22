ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'CONTACTED';
ALTER TYPE "LeadEventType" ADD VALUE IF NOT EXISTS 'LEAD_RESTORED';
ALTER TYPE "LeadEventType" ADD VALUE IF NOT EXISTS 'LEAD_MANAGER_CHANGED';
ALTER TYPE "LeadHistoryAction" ADD VALUE IF NOT EXISTS 'ARCHIVED';
ALTER TYPE "LeadHistoryAction" ADD VALUE IF NOT EXISTS 'RESTORED';
ALTER TYPE "LeadHistoryAction" ADD VALUE IF NOT EXISTS 'MANAGER_CHANGED';
ALTER TYPE "LeadHistoryAction" ADD VALUE IF NOT EXISTS 'DUPLICATE_DETECTED';

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lastContactAt" TIMESTAMP(3);
ALTER TABLE "LeadHistory" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "LeadHistory" ADD COLUMN IF NOT EXISTS "before" JSONB;
ALTER TABLE "LeadHistory" ADD COLUMN IF NOT EXISTS "after" JSONB;
UPDATE "LeadHistory" lh SET "organizationId" = l."organizationId" FROM "Lead" l WHERE lh."leadId" = l."id" AND lh."organizationId" IS NULL;
ALTER TABLE "LeadHistory" ALTER COLUMN "organizationId" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "Lead_organizationId_lastContactAt_idx" ON "Lead"("organizationId", "lastContactAt");
CREATE INDEX IF NOT EXISTS "Lead_organizationId_deletedAt_createdAt_idx" ON "Lead"("organizationId", "deletedAt", "createdAt");
CREATE INDEX IF NOT EXISTS "Lead_organizationId_createdByUserId_createdAt_idx" ON "Lead"("organizationId", "createdByUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "LeadHistory_organizationId_leadId_createdAt_idx" ON "LeadHistory"("organizationId", "leadId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "Lead_org_normalizedPhone_active_key" ON "Lead"("organizationId", "normalizedPhone") WHERE "normalizedPhone" IS NOT NULL AND "deletedAt" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Lead_org_normalizedEmail_active_key" ON "Lead"("organizationId", "normalizedEmail") WHERE "normalizedEmail" IS NOT NULL AND "deletedAt" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Lead_org_document_active_key" ON "Lead"("organizationId", "document") WHERE "document" IS NOT NULL AND "deletedAt" IS NULL;

WITH perms(code, description) AS (VALUES
 ('leads:create','Create leads'),('leads:read','Read leads'),('leads:read-all','Read all leads in tenant'),('leads:update','Update leads'),('leads:assign','Assign leads'),('leads:unassign','Unassign leads'),('leads:archive','Archive leads'),('leads:restore','Restore leads'),('leads:manage-duplicates','Manage lead duplicates'),('leads:history:read','Read lead history')
)
INSERT INTO "Permission" ("id", "code", "description", "createdAt", "updatedAt")
SELECT 'perm_' || replace(code, ':', '_'), code, description, now(), now() FROM perms
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "createdAt")
SELECT 'rp_' || r."code" || '_' || replace(p."code", ':', '_'), r."id", p."id", now()
FROM "RbacRole" r CROSS JOIN "Permission" p
WHERE r."organizationId" IS NULL AND r."deletedAt" IS NULL AND r."code" IN ('GLOBAL_ADMIN','ORG_ADMIN') AND p."code" LIKE 'leads:%'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "createdAt")
SELECT 'rp_' || r."code" || '_' || replace(p."code", ':', '_'), r."id", p."id", now()
FROM "RbacRole" r JOIN "Permission" p ON p."code" IN ('leads:create','leads:read','leads:read-all','leads:update','leads:assign','leads:unassign','leads:archive','leads:manage-duplicates','leads:history:read')
WHERE r."organizationId" IS NULL AND r."deletedAt" IS NULL AND r."code" = 'MANAGER'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "createdAt")
SELECT 'rp_' || r."code" || '_' || replace(p."code", ':', '_'), r."id", p."id", now()
FROM "RbacRole" r JOIN "Permission" p ON p."code" IN ('leads:create','leads:read','leads:update','leads:history:read')
WHERE r."organizationId" IS NULL AND r."deletedAt" IS NULL AND r."code" = 'BROKER'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
