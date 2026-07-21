-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('OPEN', 'WON', 'LOST', 'REOPENED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DealMovementType" AS ENUM ('CREATED', 'STAGE_CHANGED', 'PIPELINE_CHANGED', 'REOPENED');

-- CreateEnum
CREATE TYPE "DealActivityType" AS ENUM ('TASK', 'CALL', 'MEETING', 'EMAIL', 'WHATSAPP', 'NOTE', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "DealActivityStatus" AS ENUM ('OPEN', 'DONE', 'CANCELED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "StageChecklistType" AS ENUM ('DOCUMENT', 'FIELD', 'TASK', 'APPROVAL', 'CUSTOM');

-- CreateTable
CREATE TABLE "Pipeline" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'BRL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Pipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineStage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "probability" INTEGER NOT NULL DEFAULT 0,
    "slaHours" INTEGER,
    "isInitial" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "color" VARCHAR(32),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageChecklist" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "StageChecklistType" NOT NULL DEFAULT 'CUSTOM',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "StageChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineLossReason" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "pipelineId" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "PipelineLossReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "ownerId" TEXT,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "DealStatus" NOT NULL DEFAULT 'OPEN',
    "estimatedValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "closedValue" DECIMAL(18,2),
    "currency" VARCHAR(8) NOT NULL DEFAULT 'BRL',
    "expectedCloseDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "wonAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3),
    "lossReasonId" TEXT,
    "currentStageEnteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMovementAt" TIMESTAMP(3),
    "probabilityOverride" INTEGER,
    "source" VARCHAR(128),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealStageMovement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "fromStageId" TEXT,
    "toStageId" TEXT NOT NULL,
    "movedByUserId" TEXT,
    "movementType" "DealMovementType" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealStageMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dealId" TEXT,
    "eventType" VARCHAR(100) NOT NULL,
    "actorUserId" TEXT,
    "payload" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealAssignment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "fromUserId" TEXT,
    "toUserId" TEXT,
    "assignedByUserId" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "color" VARCHAR(32),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealTag" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealActivity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "leadId" TEXT,
    "assignedToUserId" TEXT,
    "createdByUserId" TEXT,
    "type" "DealActivityType" NOT NULL,
    "status" "DealActivityStatus" NOT NULL DEFAULT 'OPEN',
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "externalCalendarEventId" TEXT,
    "externalMessageId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "DealActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "module" VARCHAR(80) NOT NULL,
    "entityType" VARCHAR(120) NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" VARCHAR(160) NOT NULL,
    "actorUserId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "ipAddress" VARCHAR(64),
    "userAgent" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pipeline_organizationId_idx" ON "Pipeline"("organizationId");

-- CreateIndex
CREATE INDEX "Pipeline_organizationId_isActive_idx" ON "Pipeline"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "Pipeline_organizationId_isDefault_idx" ON "Pipeline"("organizationId", "isDefault");

-- CreateIndex
CREATE INDEX "PipelineStage_organizationId_idx" ON "PipelineStage"("organizationId");

-- CreateIndex
CREATE INDEX "PipelineStage_pipelineId_idx" ON "PipelineStage"("pipelineId");

-- CreateIndex
CREATE INDEX "PipelineStage_organizationId_pipelineId_position_idx" ON "PipelineStage"("organizationId", "pipelineId", "position");

-- CreateIndex
CREATE INDEX "PipelineStage_organizationId_pipelineId_isActive_idx" ON "PipelineStage"("organizationId", "pipelineId", "isActive");

-- CreateIndex
CREATE INDEX "StageChecklist_organizationId_idx" ON "StageChecklist"("organizationId");

-- CreateIndex
CREATE INDEX "StageChecklist_organizationId_stageId_idx" ON "StageChecklist"("organizationId", "stageId");

-- CreateIndex
CREATE INDEX "StageChecklist_organizationId_stageId_position_idx" ON "StageChecklist"("organizationId", "stageId", "position");

-- CreateIndex
CREATE INDEX "StageChecklist_organizationId_stageId_isActive_idx" ON "StageChecklist"("organizationId", "stageId", "isActive");

-- CreateIndex
CREATE INDEX "PipelineLossReason_organizationId_idx" ON "PipelineLossReason"("organizationId");

-- CreateIndex
CREATE INDEX "PipelineLossReason_organizationId_pipelineId_idx" ON "PipelineLossReason"("organizationId", "pipelineId");

-- CreateIndex
CREATE INDEX "PipelineLossReason_organizationId_isActive_idx" ON "PipelineLossReason"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "Deal_organizationId_idx" ON "Deal"("organizationId");

-- CreateIndex
CREATE INDEX "Deal_organizationId_leadId_idx" ON "Deal"("organizationId", "leadId");

-- CreateIndex
CREATE INDEX "Deal_organizationId_pipelineId_idx" ON "Deal"("organizationId", "pipelineId");

-- CreateIndex
CREATE INDEX "Deal_organizationId_pipelineId_stageId_idx" ON "Deal"("organizationId", "pipelineId", "stageId");

-- CreateIndex
CREATE INDEX "Deal_organizationId_status_idx" ON "Deal"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Deal_organizationId_ownerId_idx" ON "Deal"("organizationId", "ownerId");

-- CreateIndex
CREATE INDEX "Deal_organizationId_expectedCloseDate_idx" ON "Deal"("organizationId", "expectedCloseDate");

-- CreateIndex
CREATE INDEX "Deal_organizationId_createdAt_idx" ON "Deal"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Deal_organizationId_closedAt_idx" ON "Deal"("organizationId", "closedAt");

-- CreateIndex
CREATE INDEX "Deal_organizationId_wonAt_idx" ON "Deal"("organizationId", "wonAt");

-- CreateIndex
CREATE INDEX "Deal_organizationId_lostAt_idx" ON "Deal"("organizationId", "lostAt");

-- CreateIndex
CREATE INDEX "Deal_organizationId_lossReasonId_idx" ON "Deal"("organizationId", "lossReasonId");

-- CreateIndex
CREATE INDEX "Deal_organizationId_pipelineId_stageId_status_idx" ON "Deal"("organizationId", "pipelineId", "stageId", "status");

-- CreateIndex
CREATE INDEX "DealStageMovement_organizationId_idx" ON "DealStageMovement"("organizationId");

-- CreateIndex
CREATE INDEX "DealStageMovement_organizationId_dealId_idx" ON "DealStageMovement"("organizationId", "dealId");

-- CreateIndex
CREATE INDEX "DealStageMovement_organizationId_pipelineId_idx" ON "DealStageMovement"("organizationId", "pipelineId");

-- CreateIndex
CREATE INDEX "DealStageMovement_organizationId_fromStageId_idx" ON "DealStageMovement"("organizationId", "fromStageId");

-- CreateIndex
CREATE INDEX "DealStageMovement_organizationId_toStageId_idx" ON "DealStageMovement"("organizationId", "toStageId");

-- CreateIndex
CREATE INDEX "DealStageMovement_organizationId_occurredAt_idx" ON "DealStageMovement"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "DealStageMovement_organizationId_pipelineId_toStageId_occur_idx" ON "DealStageMovement"("organizationId", "pipelineId", "toStageId", "occurredAt");

-- CreateIndex
CREATE INDEX "DealEvent_organizationId_idx" ON "DealEvent"("organizationId");

-- CreateIndex
CREATE INDEX "DealEvent_organizationId_dealId_idx" ON "DealEvent"("organizationId", "dealId");

-- CreateIndex
CREATE INDEX "DealEvent_organizationId_eventType_idx" ON "DealEvent"("organizationId", "eventType");

-- CreateIndex
CREATE INDEX "DealEvent_organizationId_occurredAt_idx" ON "DealEvent"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "DealEvent_organizationId_eventType_occurredAt_idx" ON "DealEvent"("organizationId", "eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "DealAssignment_organizationId_idx" ON "DealAssignment"("organizationId");

-- CreateIndex
CREATE INDEX "DealAssignment_organizationId_dealId_idx" ON "DealAssignment"("organizationId", "dealId");

-- CreateIndex
CREATE INDEX "DealAssignment_organizationId_fromUserId_idx" ON "DealAssignment"("organizationId", "fromUserId");

-- CreateIndex
CREATE INDEX "DealAssignment_organizationId_toUserId_idx" ON "DealAssignment"("organizationId", "toUserId");

-- CreateIndex
CREATE INDEX "DealAssignment_organizationId_assignedByUserId_idx" ON "DealAssignment"("organizationId", "assignedByUserId");

-- CreateIndex
CREATE INDEX "DealAssignment_organizationId_occurredAt_idx" ON "DealAssignment"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "Tag_organizationId_idx" ON "Tag"("organizationId");

-- CreateIndex
CREATE INDEX "Tag_organizationId_isActive_idx" ON "Tag"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_organizationId_slug_key" ON "Tag"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "DealTag_organizationId_idx" ON "DealTag"("organizationId");

-- CreateIndex
CREATE INDEX "DealTag_organizationId_dealId_idx" ON "DealTag"("organizationId", "dealId");

-- CreateIndex
CREATE INDEX "DealTag_organizationId_tagId_idx" ON "DealTag"("organizationId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "DealTag_dealId_tagId_key" ON "DealTag"("dealId", "tagId");

-- CreateIndex
CREATE INDEX "DealActivity_organizationId_idx" ON "DealActivity"("organizationId");

-- CreateIndex
CREATE INDEX "DealActivity_organizationId_dealId_idx" ON "DealActivity"("organizationId", "dealId");

-- CreateIndex
CREATE INDEX "DealActivity_organizationId_leadId_idx" ON "DealActivity"("organizationId", "leadId");

-- CreateIndex
CREATE INDEX "DealActivity_organizationId_assignedToUserId_idx" ON "DealActivity"("organizationId", "assignedToUserId");

-- CreateIndex
CREATE INDEX "DealActivity_organizationId_status_idx" ON "DealActivity"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DealActivity_organizationId_dueAt_idx" ON "DealActivity"("organizationId", "dueAt");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_module_idx" ON "AuditLog"("module");

-- CreateIndex
CREATE INDEX "AuditLog_module_entityType_idx" ON "AuditLog"("module", "entityType");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_module_idx" ON "AuditLog"("organizationId", "module");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_module_entityType_idx" ON "AuditLog"("organizationId", "module", "entityType");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_occurredAt_idx" ON "AuditLog"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- AddForeignKey
ALTER TABLE "Pipeline" ADD CONSTRAINT "Pipeline_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageChecklist" ADD CONSTRAINT "StageChecklist_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageChecklist" ADD CONSTRAINT "StageChecklist_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineLossReason" ADD CONSTRAINT "PipelineLossReason_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineLossReason" ADD CONSTRAINT "PipelineLossReason_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_lossReasonId_fkey" FOREIGN KEY ("lossReasonId") REFERENCES "PipelineLossReason"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealStageMovement" ADD CONSTRAINT "DealStageMovement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealStageMovement" ADD CONSTRAINT "DealStageMovement_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealStageMovement" ADD CONSTRAINT "DealStageMovement_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "PipelineStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealStageMovement" ADD CONSTRAINT "DealStageMovement_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "PipelineStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealStageMovement" ADD CONSTRAINT "DealStageMovement_movedByUserId_fkey" FOREIGN KEY ("movedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealEvent" ADD CONSTRAINT "DealEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealEvent" ADD CONSTRAINT "DealEvent_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealEvent" ADD CONSTRAINT "DealEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealAssignment" ADD CONSTRAINT "DealAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealAssignment" ADD CONSTRAINT "DealAssignment_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealAssignment" ADD CONSTRAINT "DealAssignment_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealAssignment" ADD CONSTRAINT "DealAssignment_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealAssignment" ADD CONSTRAINT "DealAssignment_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealTag" ADD CONSTRAINT "DealTag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealTag" ADD CONSTRAINT "DealTag_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealTag" ADD CONSTRAINT "DealTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealTag" ADD CONSTRAINT "DealTag_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealActivity" ADD CONSTRAINT "DealActivity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealActivity" ADD CONSTRAINT "DealActivity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealActivity" ADD CONSTRAINT "DealActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealActivity" ADD CONSTRAINT "DealActivity_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealActivity" ADD CONSTRAINT "DealActivity_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

