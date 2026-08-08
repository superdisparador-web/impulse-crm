-- Create the Prisma enum without disturbing databases where the type was
-- provisioned during the Embedded Signup rollout.
DO $$
BEGIN
  CREATE TYPE "WhatsappCredentialType" AS ENUM ('OAUTH_USER', 'SYSTEM_USER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- PostgreSQL cannot cast a column default while changing TEXT to an enum.
ALTER TABLE "WhatsappAccount"
  ALTER COLUMN "credentialType" DROP DEFAULT,
  ALTER COLUMN "credentialType" TYPE "WhatsappCredentialType"
    USING ("credentialType"::"WhatsappCredentialType"),
  ALTER COLUMN "credentialType" SET DEFAULT 'OAUTH_USER';
