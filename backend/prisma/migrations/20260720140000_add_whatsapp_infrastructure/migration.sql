CREATE TYPE "WhatsappAccountStatus" AS ENUM ('CONNECTED', 'DISCONNECTED');

CREATE TABLE "WhatsappAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phoneNumber" VARCHAR(32) NOT NULL,
    "phoneNumberId" VARCHAR(128) NOT NULL,
    "businessAccountId" VARCHAR(128) NOT NULL,
    "accessToken" TEXT NOT NULL,
    "verifyToken" VARCHAR(255) NOT NULL,
    "webhookSecret" VARCHAR(255),
    "status" "WhatsappAccountStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "connectedAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WhatsappAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WhatsappTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(64) NOT NULL,
    "language" VARCHAR(16) NOT NULL,
    "status" VARCHAR(64) NOT NULL,
    "components" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WhatsappTemplate_organizationId_name_language_key" ON "WhatsappTemplate"("organizationId", "name", "language");
CREATE INDEX "WhatsappAccount_organizationId_idx" ON "WhatsappAccount"("organizationId");
CREATE INDEX "WhatsappAccount_phoneNumberId_idx" ON "WhatsappAccount"("phoneNumberId");
CREATE INDEX "WhatsappAccount_businessAccountId_idx" ON "WhatsappAccount"("businessAccountId");
CREATE INDEX "WhatsappAccount_status_idx" ON "WhatsappAccount"("status");
CREATE INDEX "WhatsappAccount_deletedAt_idx" ON "WhatsappAccount"("deletedAt");
CREATE INDEX "WhatsappTemplate_organizationId_idx" ON "WhatsappTemplate"("organizationId");
CREATE INDEX "WhatsappTemplate_category_idx" ON "WhatsappTemplate"("category");
CREATE INDEX "WhatsappTemplate_status_idx" ON "WhatsappTemplate"("status");

ALTER TABLE "WhatsappAccount" ADD CONSTRAINT "WhatsappAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WhatsappTemplate" ADD CONSTRAINT "WhatsappTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
