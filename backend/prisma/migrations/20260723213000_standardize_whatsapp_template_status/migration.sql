UPDATE "WhatsappTemplate" SET "status" = 'DISABLED' WHERE "status" IN ('PAUSED', 'DELETED');

CREATE TYPE "WhatsappTemplateStatus_new" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'DISABLED');
ALTER TABLE "WhatsappTemplate" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "WhatsappTemplate" ALTER COLUMN "status" TYPE "WhatsappTemplateStatus_new" USING ("status"::text::"WhatsappTemplateStatus_new");
ALTER TABLE "WhatsappTemplate" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
DROP TYPE "WhatsappTemplateStatus";
ALTER TYPE "WhatsappTemplateStatus_new" RENAME TO "WhatsappTemplateStatus";
