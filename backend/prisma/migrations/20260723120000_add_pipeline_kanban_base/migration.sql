ALTER TABLE "Pipeline" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Pipeline" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;
ALTER TABLE "Pipeline" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "PipelineStage" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PipelineStage" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "PipelineLead" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "pipelineId" TEXT NOT NULL,
  "stageId" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "enteredStageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PipelineLead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PipelineLead_organizationId_pipelineId_leadId_key" ON "PipelineLead"("organizationId", "pipelineId", "leadId");
CREATE INDEX IF NOT EXISTS "Pipeline_deletedAt_idx" ON "Pipeline"("deletedAt");
CREATE INDEX IF NOT EXISTS "Pipeline_organizationId_active_deletedAt_idx" ON "Pipeline"("organizationId", "active", "deletedAt");
CREATE INDEX IF NOT EXISTS "PipelineStage_deletedAt_idx" ON "PipelineStage"("deletedAt");
CREATE INDEX IF NOT EXISTS "PipelineLead_organizationId_idx" ON "PipelineLead"("organizationId");
CREATE INDEX IF NOT EXISTS "PipelineLead_pipelineId_idx" ON "PipelineLead"("pipelineId");
CREATE INDEX IF NOT EXISTS "PipelineLead_stageId_idx" ON "PipelineLead"("stageId");
CREATE INDEX IF NOT EXISTS "PipelineLead_leadId_idx" ON "PipelineLead"("leadId");
CREATE INDEX IF NOT EXISTS "PipelineLead_position_idx" ON "PipelineLead"("position");
CREATE INDEX IF NOT EXISTS "PipelineLead_deletedAt_idx" ON "PipelineLead"("deletedAt");
CREATE INDEX IF NOT EXISTS "PipelineLead_organizationId_pipelineId_stageId_position_idx" ON "PipelineLead"("organizationId", "pipelineId", "stageId", "position");
CREATE UNIQUE INDEX IF NOT EXISTS "Pipeline_organizationId_name_active_unique" ON "Pipeline"("organizationId", "name") WHERE "deletedAt" IS NULL AND "active" = true;

DO $$ BEGIN
  ALTER TABLE "Pipeline" ADD CONSTRAINT "Pipeline_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PipelineLead" ADD CONSTRAINT "PipelineLead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PipelineLead" ADD CONSTRAINT "PipelineLead_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PipelineLead" ADD CONSTRAINT "PipelineLead_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PipelineLead" ADD CONSTRAINT "PipelineLead_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
