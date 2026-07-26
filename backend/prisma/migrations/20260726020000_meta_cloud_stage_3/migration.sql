ALTER TABLE "Campaign" ADD COLUMN "updatedById" TEXT,
ADD COLUMN "currentStep" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "category" VARCHAR(32),
ADD COLUMN "internalNotes" TEXT,
ADD COLUMN "variableMappings" JSONB,
ADD COLUMN "destinationConfig" JSONB,
ADD COLUMN "listConfirmedAt" TIMESTAMP(3),
ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "CampaignRecipient" ADD COLUMN "organizationId" TEXT,
ADD COLUMN "originalRowNumber" INTEGER,
ADD COLUMN "originalData" JSONB,
ADD COLUMN "phoneOriginal" VARCHAR(64),
ADD COLUMN "invalidReason" VARCHAR(64),
ADD COLUMN "duplicateOfRecipientId" TEXT;
UPDATE "CampaignRecipient" r SET "organizationId" = c."organizationId" FROM "Campaign" c WHERE r."campaignId" = c."id";
ALTER TABLE "CampaignRecipient" ALTER COLUMN "organizationId" SET NOT NULL;
CREATE TABLE "CampaignImport" (
  "id" TEXT NOT NULL, "campaignId" TEXT NOT NULL, "organizationId" TEXT NOT NULL,
  "storageKey" VARCHAR(500) NOT NULL, "originalName" VARCHAR(255) NOT NULL,
  "mimeType" VARCHAR(128) NOT NULL, "size" INTEGER NOT NULL, "sha256" CHAR(64) NOT NULL,
  "status" VARCHAR(32) NOT NULL DEFAULT 'UPLOADED', "headers" JSONB, "columnMapping" JSONB,
  "sample" JSONB, "totalRows" INTEGER NOT NULL DEFAULT 0, "validRows" INTEGER NOT NULL DEFAULT 0,
  "invalidRows" INTEGER NOT NULL DEFAULT 0, "duplicateRows" INTEGER NOT NULL DEFAULT 0,
  "ddiCorrectedRows" INTEGER NOT NULL DEFAULT 0, "missingNameRows" INTEGER NOT NULL DEFAULT 0,
  "errorReason" VARCHAR(255), "createdById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "CampaignImport_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CampaignAgent" ("id" TEXT NOT NULL,"campaignId" TEXT NOT NULL,"userId" TEXT NOT NULL,"position" INTEGER NOT NULL,"weight" INTEGER NOT NULL DEFAULT 1,"active" BOOLEAN NOT NULL DEFAULT true,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "CampaignAgent_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "CampaignImport_campaignId_key" ON "CampaignImport"("campaignId");
CREATE UNIQUE INDEX "CampaignImport_storageKey_key" ON "CampaignImport"("storageKey");
CREATE INDEX "CampaignImport_organizationId_sha256_idx" ON "CampaignImport"("organizationId", "sha256");
CREATE UNIQUE INDEX "CampaignAgent_campaignId_userId_key" ON "CampaignAgent"("campaignId", "userId");
CREATE INDEX "CampaignAgent_campaignId_position_idx" ON "CampaignAgent"("campaignId", "position");
CREATE INDEX "CampaignRecipient_organizationId_campaignId_status_idx" ON "CampaignRecipient"("organizationId", "campaignId", "status");
ALTER TABLE "CampaignImport" ADD CONSTRAINT "CampaignImport_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignAgent" ADD CONSTRAINT "CampaignAgent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignAgent" ADD CONSTRAINT "CampaignAgent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
