CREATE TYPE "WhatsappProvider" AS ENUM ('META_CLOUD', 'EVOLUTION');

ALTER TABLE "WhatsappAccount"
  ADD COLUMN "provider" "WhatsappProvider" NOT NULL DEFAULT 'META_CLOUD',
  ADD COLUMN "wabaId" VARCHAR(128),
  ADD COLUMN "tokenConfigured" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "tokenLast4" VARCHAR(4),
  ADD COLUMN "verifyTokenHash" CHAR(64),
  ADD COLUMN "webhookSubscribedAt" TIMESTAMP(3);

-- Existing official accounts used businessAccountId as the WABA identifier.
UPDATE "WhatsappAccount"
SET "wabaId" = "businessAccountId",
    "tokenLast4" = '****'
WHERE "wabaId" IS NULL;

ALTER TABLE "WhatsappAccount"
  ALTER COLUMN "wabaId" SET NOT NULL,
  ALTER COLUMN "tokenLast4" SET NOT NULL;

CREATE INDEX "WhatsappAccount_organizationId_provider_status_idx"
  ON "WhatsappAccount"("organizationId", "provider", "status");
CREATE INDEX "WhatsappAccount_wabaId_idx" ON "WhatsappAccount"("wabaId");
CREATE UNIQUE INDEX "WhatsappAccount_verifyTokenHash_key" ON "WhatsappAccount"("verifyTokenHash");
DROP INDEX IF EXISTS "WhatsappAccount_organizationId_status_idx";
ALTER TABLE "WhatsappAccount" ALTER COLUMN "businessAccountId" DROP NOT NULL;

ALTER TABLE "WhatsappWebhookEvent"
  ADD COLUMN "wabaId" VARCHAR(128),
  ADD COLUMN "phoneNumberId" VARCHAR(128);
