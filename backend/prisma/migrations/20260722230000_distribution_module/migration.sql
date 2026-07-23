CREATE TYPE "DistributionListStatus" AS ENUM ('ACTIVE','INACTIVE','ARCHIVED');
CREATE TYPE "DistributionStrategy" AS ENUM ('ROUND_ROBIN','WEIGHTED','LEAST_ASSIGNED','RANDOM','BY_TEAM','BY_REGION');
CREATE TYPE "DistributionStatus" AS ENUM ('PENDING','ASSIGNED','CONTACT_QUEUED','CONTACT_SENT','DELIVERED','READ','FAILED','CANCELLED');
CREATE TYPE "DistributionTriggerType" AS ENUM ('CAMPAIGN_BUTTON','WEBHOOK','AUTOMATION','MANUAL');
CREATE TYPE "DistributionImportMode" AS ENUM ('ADD','REPLACE','UPDATE');

CREATE TABLE "DistributionList" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "status" "DistributionListStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "DistributionList_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DistributionMember" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "distributionListId" TEXT NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "phoneE164" VARCHAR(32) NOT NULL,
  "position" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "DistributionMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DistributionCursor" (
  "organizationId" TEXT NOT NULL,
  "distributionListId" TEXT NOT NULL,
  "lastMemberId" TEXT,
  "version" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DistributionCursor_pkey" PRIMARY KEY ("organizationId","distributionListId")
);

CREATE TABLE "LeadDistribution" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "campaignId" TEXT,
  "distributionListId" TEXT NOT NULL,
  "distributionMemberId" TEXT,
  "leadId" TEXT,
  "recipientPhoneE164" VARCHAR(32) NOT NULL,
  "triggerType" "DistributionTriggerType" NOT NULL DEFAULT 'CAMPAIGN_BUTTON',
  "triggerId" VARCHAR(255),
  "webhookEventId" VARCHAR(255),
  "status" "DistributionStatus" NOT NULL DEFAULT 'PENDING',
  "strategy" "DistributionStrategy" NOT NULL DEFAULT 'ROUND_ROBIN',
  "idempotencyKey" VARCHAR(500) NOT NULL,
  "errorMessage" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "messagePayload" JSONB,
  "distributedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeadDistribution_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DistributionList_organizationId_status_idx" ON "DistributionList"("organizationId","status");
CREATE INDEX "DistributionList_organizationId_name_idx" ON "DistributionList"("organizationId","name");
CREATE INDEX "DistributionList_deletedAt_idx" ON "DistributionList"("deletedAt");
CREATE UNIQUE INDEX "DistributionMember_distributionListId_phoneE164_key" ON "DistributionMember"("distributionListId","phoneE164");
CREATE UNIQUE INDEX "DistributionMember_distributionListId_position_key" ON "DistributionMember"("distributionListId","position");
CREATE INDEX "DistributionMember_organizationId_distributionListId_isActive_position_idx" ON "DistributionMember"("organizationId","distributionListId","isActive","position");
CREATE INDEX "DistributionMember_organizationId_phoneE164_idx" ON "DistributionMember"("organizationId","phoneE164");
CREATE INDEX "DistributionMember_deletedAt_idx" ON "DistributionMember"("deletedAt");
CREATE UNIQUE INDEX "DistributionCursor_distributionListId_key" ON "DistributionCursor"("distributionListId");
CREATE INDEX "DistributionCursor_lastMemberId_idx" ON "DistributionCursor"("lastMemberId");
CREATE UNIQUE INDEX "LeadDistribution_organizationId_idempotencyKey_key" ON "LeadDistribution"("organizationId","idempotencyKey");
CREATE INDEX "LeadDistribution_organizationId_campaignId_createdAt_idx" ON "LeadDistribution"("organizationId","campaignId","createdAt");
CREATE INDEX "LeadDistribution_organizationId_distributionListId_createdAt_idx" ON "LeadDistribution"("organizationId","distributionListId","createdAt");
CREATE INDEX "LeadDistribution_organizationId_distributionMemberId_createdAt_idx" ON "LeadDistribution"("organizationId","distributionMemberId","createdAt");
CREATE INDEX "LeadDistribution_organizationId_recipientPhoneE164_idx" ON "LeadDistribution"("organizationId","recipientPhoneE164");
CREATE INDEX "LeadDistribution_organizationId_status_createdAt_idx" ON "LeadDistribution"("organizationId","status","createdAt");

ALTER TABLE "DistributionList" ADD CONSTRAINT "DistributionList_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DistributionList" ADD CONSTRAINT "DistributionList_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DistributionMember" ADD CONSTRAINT "DistributionMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DistributionMember" ADD CONSTRAINT "DistributionMember_distributionListId_fkey" FOREIGN KEY ("distributionListId") REFERENCES "DistributionList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DistributionCursor" ADD CONSTRAINT "DistributionCursor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DistributionCursor" ADD CONSTRAINT "DistributionCursor_distributionListId_fkey" FOREIGN KEY ("distributionListId") REFERENCES "DistributionList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DistributionCursor" ADD CONSTRAINT "DistributionCursor_lastMemberId_fkey" FOREIGN KEY ("lastMemberId") REFERENCES "DistributionMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeadDistribution" ADD CONSTRAINT "LeadDistribution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LeadDistribution" ADD CONSTRAINT "LeadDistribution_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeadDistribution" ADD CONSTRAINT "LeadDistribution_distributionListId_fkey" FOREIGN KEY ("distributionListId") REFERENCES "DistributionList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LeadDistribution" ADD CONSTRAINT "LeadDistribution_distributionMemberId_fkey" FOREIGN KEY ("distributionMemberId") REFERENCES "DistributionMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeadDistribution" ADD CONSTRAINT "LeadDistribution_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
