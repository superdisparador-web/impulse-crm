-- Stage 7 extends the existing campaign/distribution aggregates; no existing rows are deleted.
CREATE TYPE "AgentAvailabilityStatus" AS ENUM ('AVAILABLE','PAUSED','OFF_DUTY','INACTIVE');
CREATE TYPE "LeadAttendanceStatus" AS ENUM ('NEW','VIEWED','CONTACT_STARTED','NO_RESPONSE','INTERESTED','SCHEDULED','VISIT_COMPLETED','DOCUMENTATION','PROPOSAL','SALE','LOST','INVALID');

ALTER TABLE "CampaignSecureLink" ADD COLUMN "firstClickedAt" TIMESTAMP(3), ADD COLUMN "totalClicks" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "uniqueClicks" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "LeadDistribution" ALTER COLUMN "distributionListId" DROP NOT NULL,
  ADD COLUMN "recipientId" TEXT, ADD COLUMN "assignedUserId" TEXT, ADD COLUMN "managerUserId" TEXT,
  ADD COLUMN "attendanceStatus" "LeadAttendanceStatus" NOT NULL DEFAULT 'NEW', ADD COLUMN "slaDueAt" TIMESTAMP(3),
  ADD COLUMN "firstUpdatedAt" TIMESTAMP(3), ADD COLUMN "nextFollowUpAt" TIMESTAMP(3), ADD COLUMN "manuallyReleasedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "LeadDistribution_recipientId_key" ON "LeadDistribution"("recipientId");
ALTER TABLE "LeadDistribution" ADD CONSTRAINT "LeadDistribution_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "CampaignRecipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeadDistribution" ADD CONSTRAINT "LeadDistribution_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeadDistribution" ADD CONSTRAINT "LeadDistribution_managerUserId_fkey" FOREIGN KEY ("managerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "CampaignClickEvent" ("id" TEXT NOT NULL,"organizationId" TEXT NOT NULL,"campaignId" TEXT NOT NULL,"recipientId" TEXT NOT NULL,"secureLinkId" TEXT NOT NULL,"distributionId" TEXT,"messageId" TEXT,"clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"fingerprintHash" CHAR(64) NOT NULL,"ipHash" CHAR(64),"userAgent" VARCHAR(180),"origin" VARCHAR(64) NOT NULL DEFAULT 'CAMPAIGN_BUTTON',"isUnique" BOOLEAN NOT NULL DEFAULT false,"isRepeated" BOOLEAN NOT NULL DEFAULT false,"redirectStatus" VARCHAR(32) NOT NULL,"finalUrlHash" CHAR(64),CONSTRAINT "CampaignClickEvent_pkey" PRIMARY KEY ("id"));
CREATE INDEX "CampaignClickEvent_organizationId_campaignId_clickedAt_idx" ON "CampaignClickEvent"("organizationId","campaignId","clickedAt");
CREATE INDEX "CampaignClickEvent_recipientId_clickedAt_idx" ON "CampaignClickEvent"("recipientId","clickedAt");
ALTER TABLE "CampaignClickEvent" ADD CONSTRAINT "CampaignClickEvent_secureLinkId_fkey" FOREIGN KEY ("secureLinkId") REFERENCES "CampaignSecureLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignClickEvent" ADD CONSTRAINT "CampaignClickEvent_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "LeadDistribution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CampaignClickEvent" ADD CONSTRAINT "CampaignClickEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CampaignClickEvent" ADD CONSTRAINT "CampaignClickEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignClickEvent" ADD CONSTRAINT "CampaignClickEvent_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "CampaignRecipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AgentAvailability" ("userId" TEXT NOT NULL,"organizationId" TEXT NOT NULL,"status" "AgentAvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',"changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"changedById" TEXT,"reason" VARCHAR(500),CONSTRAINT "AgentAvailability_pkey" PRIMARY KEY ("userId"));
CREATE INDEX "AgentAvailability_organizationId_status_idx" ON "AgentAvailability"("organizationId","status");
ALTER TABLE "AgentAvailability" ADD CONSTRAINT "AgentAvailability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "DistributionSettings" ("organizationId" TEXT NOT NULL,"requirePreviousUpdates" BOOLEAN NOT NULL DEFAULT false,"firstContactMinutes" INTEGER NOT NULL DEFAULT 15,"firstUpdateMinutes" INTEGER NOT NULL DEFAULT 60,"nextFollowUpMinutes" INTEGER NOT NULL DEFAULT 1440,"fallbackUrl" VARCHAR(500),"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "DistributionSettings_pkey" PRIMARY KEY ("organizationId"));
CREATE TABLE "DistributionHistory" ("id" TEXT NOT NULL,"organizationId" TEXT NOT NULL,"distributionId" TEXT NOT NULL,"actorUserId" TEXT,"action" VARCHAR(80) NOT NULL,"before" JSONB,"after" JSONB,"reason" VARCHAR(500),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "DistributionHistory_pkey" PRIMARY KEY ("id"));
CREATE INDEX "DistributionHistory_organizationId_distributionId_createdAt_idx" ON "DistributionHistory"("organizationId","distributionId","createdAt");
ALTER TABLE "DistributionHistory" ADD CONSTRAINT "DistributionHistory_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "LeadDistribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "DistributionFollowUp" ("id" TEXT NOT NULL,"organizationId" TEXT NOT NULL,"distributionId" TEXT NOT NULL,"answeredById" TEXT NOT NULL,"contactAttempted" VARCHAR(32) NOT NULL,"customerResponded" VARCHAR(32) NOT NULL,"status" "LeadAttendanceStatus" NOT NULL,"notes" VARCHAR(1000),"nextFollowUpAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "DistributionFollowUp_pkey" PRIMARY KEY ("id"));
CREATE INDEX "DistributionFollowUp_organizationId_distributionId_createdAt_idx" ON "DistributionFollowUp"("organizationId","distributionId","createdAt");
ALTER TABLE "DistributionFollowUp" ADD CONSTRAINT "DistributionFollowUp_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "LeadDistribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
