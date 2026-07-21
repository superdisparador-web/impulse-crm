ALTER TYPE "LeadHistoryAction" ADD VALUE IF NOT EXISTS 'MOVED';

CREATE TABLE "Pipeline" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Pipeline_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PipelineStage" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "color" VARCHAR(16) NOT NULL DEFAULT '#2563eb',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "pipelineId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PipelineHistory" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "pipelineId" TEXT NOT NULL,
  "fromStageId" TEXT,
  "toStageId" TEXT NOT NULL,
  "performedByUserId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PipelineHistory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Lead" ADD COLUMN "pipelineId" TEXT, ADD COLUMN "stageId" TEXT;
CREATE INDEX "Pipeline_organizationId_idx" ON "Pipeline"("organizationId");
CREATE INDEX "Pipeline_active_idx" ON "Pipeline"("active");
CREATE INDEX "Pipeline_deletedAt_idx" ON "Pipeline"("deletedAt");
CREATE INDEX "PipelineStage_pipelineId_idx" ON "PipelineStage"("pipelineId");
CREATE INDEX "PipelineStage_order_idx" ON "PipelineStage"("order");
CREATE INDEX "PipelineStage_active_idx" ON "PipelineStage"("active");
CREATE INDEX "PipelineStage_deletedAt_idx" ON "PipelineStage"("deletedAt");
CREATE INDEX "PipelineHistory_leadId_idx" ON "PipelineHistory"("leadId");
CREATE INDEX "PipelineHistory_pipelineId_idx" ON "PipelineHistory"("pipelineId");
CREATE INDEX "PipelineHistory_fromStageId_idx" ON "PipelineHistory"("fromStageId");
CREATE INDEX "PipelineHistory_toStageId_idx" ON "PipelineHistory"("toStageId");
CREATE INDEX "PipelineHistory_performedByUserId_idx" ON "PipelineHistory"("performedByUserId");
CREATE INDEX "PipelineHistory_createdAt_idx" ON "PipelineHistory"("createdAt");
CREATE INDEX "Lead_pipelineId_idx" ON "Lead"("pipelineId");
CREATE INDEX "Lead_stageId_idx" ON "Lead"("stageId");
ALTER TABLE "Pipeline" ADD CONSTRAINT "Pipeline_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PipelineHistory" ADD CONSTRAINT "PipelineHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PipelineHistory" ADD CONSTRAINT "PipelineHistory_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PipelineHistory" ADD CONSTRAINT "PipelineHistory_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "PipelineStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PipelineHistory" ADD CONSTRAINT "PipelineHistory_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "PipelineStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PipelineHistory" ADD CONSTRAINT "PipelineHistory_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
