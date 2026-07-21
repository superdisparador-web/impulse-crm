ALTER TYPE "LeadSource" ADD VALUE IF NOT EXISTS 'CSV_IMPORT';
ALTER TYPE "LeadSource" ADD VALUE IF NOT EXISTS 'META_ADS';
ALTER TYPE "LeadSource" ADD VALUE IF NOT EXISTS 'WEBSITE';
ALTER TYPE "LeadSource" ADD VALUE IF NOT EXISTS 'PUBLIC_API';
ALTER TYPE "LeadSource" ADD VALUE IF NOT EXISTS 'WEBHOOK';
ALTER TYPE "LeadSource" ADD VALUE IF NOT EXISTS 'ORGANIC';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'ASSIGNED';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'CONTACT_PENDING';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'IN_CONTACT';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';
ALTER TYPE "LeadTemperature" ADD VALUE IF NOT EXISTS 'UNKNOWN';
CREATE TYPE "LeadEventType" AS ENUM ('LEAD_CREATED','LEAD_UPDATED','LEAD_ASSIGNED','LEAD_UNASSIGNED','LEAD_STATUS_CHANGED','LEAD_TEMPERATURE_CHANGED','LEAD_ARCHIVED','LEAD_CONVERTED','LEAD_LOST','LEAD_DUPLICATE_DETECTED','LEAD_ACTIVITY_CREATED','LEAD_ACTIVITY_UPDATED','LEAD_ACTIVITY_COMPLETED');
CREATE TYPE "LeadActivityStatus" AS ENUM ('PENDING','IN_PROGRESS','COMPLETED','CANCELED');
CREATE TYPE "LeadActivityPriority" AS ENUM ('LOW','MEDIUM','HIGH','URGENT');

ALTER TABLE "Lead" ALTER COLUMN "name" DROP NOT NULL;
ALTER TABLE "Lead" ALTER COLUMN "phone" DROP NOT NULL;
ALTER TABLE "Lead" ALTER COLUMN "normalizedPhone" DROP NOT NULL;
ALTER TABLE "Lead" ADD COLUMN "normalizedEmail" VARCHAR(255);
ALTER TABLE "Lead" ADD COLUMN "score" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Lead" ADD COLUMN "managerUserId" TEXT;
ALTER TABLE "Lead" ADD COLUMN "createdByUserId" TEXT;
ALTER TABLE "Lead" ADD COLUMN "lastAssignedAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "lastInteractionAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "convertedAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "lostAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "metadata" JSONB;
UPDATE "Lead" SET "normalizedEmail" = lower(trim("email")) WHERE "email" IS NOT NULL;

CREATE TABLE "LeadExternalIdentity" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "provider" VARCHAR(64) NOT NULL,
  "externalId" VARCHAR(255) NOT NULL,
  "externalAccountId" VARCHAR(255),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeadExternalIdentity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeadEvent" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "eventType" "LeadEventType" NOT NULL,
  "description" VARCHAR(500) NOT NULL,
  "payload" JSONB,
  "actorUserId" TEXT,
  "requestId" TEXT,
  "idempotencyKey" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeadActivity" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "status" "LeadActivityStatus" NOT NULL DEFAULT 'PENDING',
  "priority" "LeadActivityPriority" NOT NULL DEFAULT 'MEDIUM',
  "note" TEXT,
  "completedAt" TIMESTAMP(3),
  "responsibleUserId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Lead_organizationId_createdAt_idx" ON "Lead"("organizationId", "createdAt");
CREATE INDEX "Lead_organizationId_updatedAt_idx" ON "Lead"("organizationId", "updatedAt");
CREATE INDEX "Lead_organizationId_status_createdAt_idx" ON "Lead"("organizationId", "status", "createdAt");
CREATE INDEX "Lead_organizationId_assignedUserId_status_createdAt_idx" ON "Lead"("organizationId", "assignedUserId", "status", "createdAt");
CREATE INDEX "Lead_organizationId_managerUserId_status_createdAt_idx" ON "Lead"("organizationId", "managerUserId", "status", "createdAt");
CREATE INDEX "Lead_organizationId_source_createdAt_idx" ON "Lead"("organizationId", "source", "createdAt");
CREATE INDEX "Lead_organizationId_normalizedPhone_idx" ON "Lead"("organizationId", "normalizedPhone");
CREATE INDEX "Lead_organizationId_normalizedEmail_idx" ON "Lead"("organizationId", "normalizedEmail");
CREATE INDEX "Lead_organizationId_document_idx" ON "Lead"("organizationId", "document");
CREATE INDEX "Lead_organizationId_archivedAt_idx" ON "Lead"("organizationId", "archivedAt");
CREATE UNIQUE INDEX "LeadExternalIdentity_organizationId_provider_externalAccountId_externalId_key" ON "LeadExternalIdentity"("organizationId", "provider", "externalAccountId", "externalId");
CREATE INDEX "LeadExternalIdentity_organizationId_leadId_idx" ON "LeadExternalIdentity"("organizationId", "leadId");
CREATE INDEX "LeadExternalIdentity_organizationId_provider_idx" ON "LeadExternalIdentity"("organizationId", "provider");
CREATE INDEX "LeadEvent_organizationId_leadId_occurredAt_idx" ON "LeadEvent"("organizationId", "leadId", "occurredAt");
CREATE INDEX "LeadEvent_organizationId_eventType_occurredAt_idx" ON "LeadEvent"("organizationId", "eventType", "occurredAt");
CREATE INDEX "LeadEvent_organizationId_actorUserId_occurredAt_idx" ON "LeadEvent"("organizationId", "actorUserId", "occurredAt");
CREATE INDEX "LeadEvent_organizationId_requestId_idx" ON "LeadEvent"("organizationId", "requestId");
CREATE UNIQUE INDEX "LeadEvent_organizationId_idempotencyKey_key" ON "LeadEvent"("organizationId", "idempotencyKey");
CREATE INDEX "LeadActivity_organizationId_leadId_dueAt_idx" ON "LeadActivity"("organizationId", "leadId", "dueAt");
CREATE INDEX "LeadActivity_organizationId_responsibleUserId_status_dueAt_idx" ON "LeadActivity"("organizationId", "responsibleUserId", "status", "dueAt");
CREATE INDEX "LeadActivity_organizationId_status_priority_dueAt_idx" ON "LeadActivity"("organizationId", "status", "priority", "dueAt");

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_managerUserId_fkey" FOREIGN KEY ("managerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeadExternalIdentity" ADD CONSTRAINT "LeadExternalIdentity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadEvent" ADD CONSTRAINT "LeadEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadEvent" ADD CONSTRAINT "LeadEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
