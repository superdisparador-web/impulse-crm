ALTER TYPE "WhatsappAccountStatus" ADD VALUE IF NOT EXISTS 'ACTIVE';
ALTER TYPE "WhatsappAccountStatus" ADD VALUE IF NOT EXISTS 'INACTIVE';

ALTER TABLE "WhatsappAccount" ADD COLUMN IF NOT EXISTS "displayPhoneNumber" VARCHAR(64);
ALTER TABLE "WhatsappAccount" ADD COLUMN IF NOT EXISTS "verifiedName" VARCHAR(255);
ALTER TABLE "WhatsappAccount" ADD COLUMN IF NOT EXISTS "apiVersion" VARCHAR(16);
ALTER TABLE "WhatsappAccount" ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WhatsappAccount" ADD COLUMN IF NOT EXISTS "lastConnectionTestAt" TIMESTAMP(3);
ALTER TABLE "WhatsappAccount" ADD COLUMN IF NOT EXISTS "lastConnectionError" VARCHAR(500);

CREATE INDEX IF NOT EXISTS "WhatsappAccount_organizationId_isDefault_idx" ON "WhatsappAccount"("organizationId", "isDefault");
