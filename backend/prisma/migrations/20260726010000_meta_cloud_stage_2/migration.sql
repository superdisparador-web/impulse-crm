ALTER TYPE "WhatsappTemplateStatus" ADD VALUE IF NOT EXISTS 'PAUSED';
ALTER TYPE "WhatsappTemplateStatus" ADD VALUE IF NOT EXISTS 'IN_APPEAL';
ALTER TYPE "WhatsappTemplateStatus" ADD VALUE IF NOT EXISTS 'PENDING_DELETION';
ALTER TYPE "WhatsappTemplateStatus" ADD VALUE IF NOT EXISTS 'DELETED';
ALTER TYPE "WhatsappTemplateStatus" ADD VALUE IF NOT EXISTS 'LIMIT_EXCEEDED';
ALTER TYPE "WhatsappTemplateStatus" ADD VALUE IF NOT EXISTS 'UNKNOWN';

ALTER TABLE "WhatsappTemplate"
  ADD COLUMN "qualityScore" VARCHAR(64),
  ADD COLUMN "parameterFormat" VARCHAR(32),
  ADD COLUMN "previousCategory" VARCHAR(64),
  ADD COLUMN "createdAtMeta" TIMESTAMP(3),
  ADD COLUMN "metaStatus" VARCHAR(64),
  ADD COLUMN "webhookUpdatedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "WhatsappTemplate_organizationId_whatsappAccountId_metaTemplate_key"
  ON "WhatsappTemplate"("organizationId", "whatsappAccountId", "metaTemplateId");
