ALTER TYPE "WhatsappAccountStatus" ADD VALUE IF NOT EXISTS 'TOKEN_EXPIRED';
CREATE TYPE "WhatsappCredentialType" AS ENUM ('OAUTH_USER', 'SYSTEM_USER');
ALTER TABLE "WhatsappAccount"
  ADD COLUMN "credentialType" "WhatsappCredentialType" NOT NULL DEFAULT 'OAUTH_USER',
  ADD COLUMN "tokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN "tokenLastRenewedAt" TIMESTAMP(3),
  ADD COLUMN "grantedScopes" JSONB,
  ADD COLUMN "metaBusinessId" VARCHAR(128),
  ADD COLUMN "metaBusinessName" VARCHAR(255);
