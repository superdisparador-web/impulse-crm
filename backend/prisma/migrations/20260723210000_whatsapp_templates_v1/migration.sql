ALTER TYPE "WhatsappTemplateStatus" ADD VALUE IF NOT EXISTS 'DRAFT';

ALTER TABLE "WhatsappTemplate" ALTER COLUMN "whatsappAccountId" DROP NOT NULL;
ALTER TABLE "WhatsappTemplate" ADD COLUMN "metaTemplateId" VARCHAR(128);
ALTER TABLE "WhatsappTemplate" ADD COLUMN "displayName" VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE "WhatsappTemplate" ADD COLUMN "metaName" VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE "WhatsappTemplate" ADD COLUMN "headerType" VARCHAR(32) NOT NULL DEFAULT 'NONE';
ALTER TABLE "WhatsappTemplate" ADD COLUMN "headerText" VARCHAR(255);
ALTER TABLE "WhatsappTemplate" ADD COLUMN "body" TEXT NOT NULL DEFAULT '';
ALTER TABLE "WhatsappTemplate" ADD COLUMN "footer" VARCHAR(255);
ALTER TABLE "WhatsappTemplate" ADD COLUMN "buttons" JSONB;
ALTER TABLE "WhatsappTemplate" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "WhatsappTemplate" ADD COLUMN "archivedAt" TIMESTAMP(3);

UPDATE "WhatsappTemplate" SET "displayName" = "name" WHERE "displayName" = '';
UPDATE "WhatsappTemplate" SET "metaName" = "name" WHERE "metaName" = '';
UPDATE "WhatsappTemplate" SET "body" = COALESCE("components"::text, '') WHERE "body" = '';

CREATE INDEX "WhatsappTemplate_organizationId_category_idx" ON "WhatsappTemplate"("organizationId", "category");
CREATE INDEX "WhatsappTemplate_organizationId_language_idx" ON "WhatsappTemplate"("organizationId", "language");
CREATE INDEX "WhatsappTemplate_organizationId_isActive_idx" ON "WhatsappTemplate"("organizationId", "isActive");
