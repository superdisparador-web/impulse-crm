CREATE TYPE "LeadSource" AS ENUM ('MANUAL', 'IMPORT', 'WHATSAPP', 'CAMPAIGN', 'FACEBOOK', 'INSTAGRAM', 'LANDING_PAGE', 'REFERRAL', 'PHONE', 'OTHER');
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'LOST');
CREATE TYPE "LeadTemperature" AS ENUM ('COLD', 'WARM', 'HOT');
CREATE TYPE "LeadHistoryAction" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'TEMPERATURE_CHANGED', 'ASSIGNED', 'UNASSIGNED', 'DELETED');

CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(32) NOT NULL,
    "normalizedPhone" VARCHAR(32) NOT NULL,
    "email" VARCHAR(255),
    "document" VARCHAR(64),
    "source" "LeadSource" NOT NULL DEFAULT 'MANUAL',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "temperature" "LeadTemperature" NOT NULL DEFAULT 'COLD',
    "notes" TEXT,
    "organizationId" TEXT NOT NULL,
    "assignedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeadHistory" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "action" "LeadHistoryAction" NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "metadata" JSONB,
    "performedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Lead_organizationId_idx" ON "Lead"("organizationId");
CREATE INDEX "Lead_assignedUserId_idx" ON "Lead"("assignedUserId");
CREATE INDEX "Lead_normalizedPhone_idx" ON "Lead"("normalizedPhone");
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
CREATE INDEX "Lead_temperature_idx" ON "Lead"("temperature");
CREATE INDEX "Lead_source_idx" ON "Lead"("source");
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");
CREATE INDEX "Lead_deletedAt_idx" ON "Lead"("deletedAt");
CREATE INDEX "LeadHistory_leadId_idx" ON "LeadHistory"("leadId");
CREATE INDEX "LeadHistory_performedByUserId_idx" ON "LeadHistory"("performedByUserId");
CREATE INDEX "LeadHistory_action_idx" ON "LeadHistory"("action");
CREATE INDEX "LeadHistory_createdAt_idx" ON "LeadHistory"("createdAt");

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeadHistory" ADD CONSTRAINT "LeadHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadHistory" ADD CONSTRAINT "LeadHistory_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
