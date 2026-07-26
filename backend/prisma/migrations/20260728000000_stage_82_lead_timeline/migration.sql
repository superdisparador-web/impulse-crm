ALTER TABLE "LeadActivity"
  ADD COLUMN "type" VARCHAR(32) NOT NULL DEFAULT 'FOLLOW_UP',
  ADD COLUMN "description" TEXT,
  ADD COLUMN "result" VARCHAR(500),
  ADD COLUMN "visibility" VARCHAR(16) NOT NULL DEFAULT 'TEAM',
  ADD COLUMN "nextFollowUpAt" TIMESTAMP(3),
  ADD COLUMN "reminderMinutes" INTEGER,
  ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE INDEX "LeadActivity_organizationId_leadId_createdAt_idx"
  ON "LeadActivity"("organizationId", "leadId", "createdAt");

-- Manual rollback (only after confirming no application version reads these columns):
-- DROP INDEX "LeadActivity_organizationId_leadId_createdAt_idx";
-- ALTER TABLE "LeadActivity" DROP COLUMN "type", DROP COLUMN "description",
--   DROP COLUMN "result", DROP COLUMN "visibility", DROP COLUMN "nextFollowUpAt",
--   DROP COLUMN "reminderMinutes", DROP COLUMN "archivedAt";
