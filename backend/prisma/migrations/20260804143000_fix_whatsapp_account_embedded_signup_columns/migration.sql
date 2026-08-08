-- Extend the account status used when an Embedded Signup token expires.
ALTER TYPE "WhatsappAccountStatus" ADD VALUE IF NOT EXISTS 'TOKEN_EXPIRED';

-- Restore the Embedded Signup metadata columns that already belong to the
-- current WhatsappAccount model. The temporary TEXT type is converted to the
-- Prisma enum by the immediately following migration.
ALTER TABLE "WhatsappAccount"
  ADD COLUMN IF NOT EXISTS "credentialType" TEXT NOT NULL DEFAULT 'OAUTH_USER',
  ADD COLUMN IF NOT EXISTS "tokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "tokenLastRenewedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "grantedScopes" JSONB,
  ADD COLUMN IF NOT EXISTS "metaBusinessId" VARCHAR(128),
  ADD COLUMN IF NOT EXISTS "metaBusinessName" VARCHAR(255);
