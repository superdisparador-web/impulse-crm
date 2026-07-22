-- Official Meta WhatsApp Business Platform foundation. Rollback: drop new tables/enums/indexes and remove columns added here after backing up data.
ALTER TYPE "WhatsappAccountStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "WhatsappAccountStatus" ADD VALUE IF NOT EXISTS 'ERROR';
ALTER TYPE "WhatsappAccountStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';

CREATE TYPE "WhatsappConversationStatus" AS ENUM ('OPEN','PENDING','CLOSED','ARCHIVED');
CREATE TYPE "WhatsappMessageDirection" AS ENUM ('INBOUND','OUTBOUND');
CREATE TYPE "WhatsappMessageType" AS ENUM ('TEXT','TEMPLATE','IMAGE','DOCUMENT','AUDIO','VIDEO','LOCATION','INTERACTIVE','CONTACTS','UNKNOWN');
CREATE TYPE "WhatsappMessageStatus" AS ENUM ('RECEIVED','PENDING','SENT','DELIVERED','READ','FAILED');
CREATE TYPE "WhatsappTemplateStatus" AS ENUM ('PENDING','APPROVED','REJECTED','PAUSED','DISABLED','DELETED');
CREATE TYPE "WhatsappWebhookEventStatus" AS ENUM ('RECEIVED','PROCESSED','FAILED','IGNORED_DUPLICATE');

ALTER TABLE "WhatsappAccount" ADD COLUMN IF NOT EXISTS "normalizedPhone" VARCHAR(32);
ALTER TABLE "WhatsappAccount" ADD COLUMN IF NOT EXISTS "appId" VARCHAR(128);
ALTER TABLE "WhatsappAccount" ADD COLUMN IF NOT EXISTS "appSecret" TEXT;
ALTER TABLE "WhatsappAccount" ADD COLUMN IF NOT EXISTS "qualityRating" VARCHAR(64);
ALTER TABLE "WhatsappAccount" ADD COLUMN IF NOT EXISTS "messagingLimitTier" VARCHAR(64);
ALTER TABLE "WhatsappAccount" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;
UPDATE "WhatsappAccount" SET "normalizedPhone" = '+' || regexp_replace("phoneNumber", '\\D', '', 'g') WHERE "normalizedPhone" IS NULL;
ALTER TABLE "WhatsappAccount" ALTER COLUMN "normalizedPhone" SET NOT NULL;
ALTER TABLE "WhatsappAccount" ALTER COLUMN "verifyToken" TYPE TEXT;
ALTER TABLE "WhatsappAccount" ALTER COLUMN "webhookSecret" TYPE TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "WhatsappAccount_phoneNumberId_key" ON "WhatsappAccount"("phoneNumberId");
CREATE INDEX IF NOT EXISTS "WhatsappAccount_organizationId_status_idx" ON "WhatsappAccount"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "WhatsappAccount_organizationId_normalizedPhone_idx" ON "WhatsappAccount"("organizationId", "normalizedPhone");
ALTER TABLE "WhatsappAccount" ADD CONSTRAINT "WhatsappAccount_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WhatsappTemplate" ADD COLUMN IF NOT EXISTS "whatsappAccountId" TEXT;
UPDATE "WhatsappTemplate" t SET "whatsappAccountId" = a.id FROM "WhatsappAccount" a WHERE t."organizationId" = a."organizationId" AND t."whatsappAccountId" IS NULL;
DELETE FROM "WhatsappTemplate" WHERE "whatsappAccountId" IS NULL;
ALTER TABLE "WhatsappTemplate" ALTER COLUMN "whatsappAccountId" SET NOT NULL;
ALTER TABLE "WhatsappTemplate" ADD COLUMN IF NOT EXISTS "externalTemplateId" VARCHAR(128);
ALTER TABLE "WhatsappTemplate" ADD COLUMN IF NOT EXISTS "parameterSchema" JSONB;
ALTER TABLE "WhatsappTemplate" ADD COLUMN IF NOT EXISTS "rejectionReason" VARCHAR(500);
ALTER TABLE "WhatsappTemplate" ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMP(3);
ALTER TABLE "WhatsappTemplate" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "WhatsappTemplate" ALTER COLUMN "status" TYPE "WhatsappTemplateStatus" USING "status"::"WhatsappTemplateStatus";
ALTER TABLE "WhatsappTemplate" ADD CONSTRAINT "WhatsappTemplate_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "WhatsappAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
DROP INDEX IF EXISTS "WhatsappTemplate_organizationId_name_language_key";
CREATE UNIQUE INDEX IF NOT EXISTS "WhatsappTemplate_organizationId_whatsappAccountId_name_language_key" ON "WhatsappTemplate"("organizationId","whatsappAccountId","name","language");
CREATE INDEX IF NOT EXISTS "WhatsappTemplate_organizationId_status_idx" ON "WhatsappTemplate"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "WhatsappTemplate_whatsappAccountId_idx" ON "WhatsappTemplate"("whatsappAccountId");
CREATE INDEX IF NOT EXISTS "WhatsappTemplate_deletedAt_idx" ON "WhatsappTemplate"("deletedAt");

CREATE TABLE "WhatsappConversation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "whatsappAccountId" TEXT NOT NULL,
  "leadId" TEXT,
  "contactPhone" VARCHAR(32) NOT NULL,
  "normalizedPhone" VARCHAR(32) NOT NULL,
  "contactName" VARCHAR(255),
  "status" "WhatsappConversationStatus" NOT NULL DEFAULT 'OPEN',
  "assignedUserId" TEXT,
  "managerUserId" TEXT,
  "lastMessageAt" TIMESTAMP(3),
  "lastInboundAt" TIMESTAMP(3),
  "lastOutboundAt" TIMESTAMP(3),
  "customerServiceWindowEndsAt" TIMESTAMP(3),
  "unreadCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "WhatsappConversation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id"),
  CONSTRAINT "WhatsappConversation_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "WhatsappAccount"("id"),
  CONSTRAINT "WhatsappConversation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id"),
  CONSTRAINT "WhatsappConversation_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id"),
  CONSTRAINT "WhatsappConversation_managerUserId_fkey" FOREIGN KEY ("managerUserId") REFERENCES "User"("id")
);
CREATE UNIQUE INDEX "WhatsappConversation_active_phone_key" ON "WhatsappConversation"("whatsappAccountId","normalizedPhone") WHERE "deletedAt" IS NULL;
CREATE INDEX "WhatsappConversation_organizationId_status_lastMessageAt_idx" ON "WhatsappConversation"("organizationId","status","lastMessageAt");
CREATE INDEX "WhatsappConversation_organizationId_assignedUserId_status_idx" ON "WhatsappConversation"("organizationId","assignedUserId","status");
CREATE INDEX "WhatsappConversation_organizationId_leadId_idx" ON "WhatsappConversation"("organizationId","leadId");

CREATE TABLE "WhatsappMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "whatsappAccountId" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "leadId" TEXT,
  "externalMessageId" VARCHAR(255),
  "direction" "WhatsappMessageDirection" NOT NULL,
  "type" "WhatsappMessageType" NOT NULL,
  "status" "WhatsappMessageStatus" NOT NULL,
  "senderPhone" VARCHAR(32) NOT NULL,
  "recipientPhone" VARCHAR(32) NOT NULL,
  "text" TEXT,
  "mediaId" VARCHAR(255), "mediaUrl" VARCHAR(1000), "mimeType" VARCHAR(128), "fileName" VARCHAR(255),
  "templateName" VARCHAR(255), "templateLanguage" VARCHAR(16), "replyToExternalMessageId" VARCHAR(255),
  "errorCode" VARCHAR(128), "errorMessage" VARCHAR(500), "metadata" JSONB,
  "sentAt" TIMESTAMP(3), "deliveredAt" TIMESTAMP(3), "readAt" TIMESTAMP(3), "failedAt" TIMESTAMP(3),
  "createdByUserId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WhatsappMessage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id"),
  CONSTRAINT "WhatsappMessage_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "WhatsappAccount"("id"),
  CONSTRAINT "WhatsappMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsappConversation"("id"),
  CONSTRAINT "WhatsappMessage_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id"),
  CONSTRAINT "WhatsappMessage_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
);
CREATE UNIQUE INDEX "WhatsappMessage_organizationId_externalMessageId_key" ON "WhatsappMessage"("organizationId","externalMessageId");
CREATE INDEX "WhatsappMessage_organizationId_conversationId_createdAt_idx" ON "WhatsappMessage"("organizationId","conversationId","createdAt");
CREATE INDEX "WhatsappMessage_organizationId_status_createdAt_idx" ON "WhatsappMessage"("organizationId","status","createdAt");
CREATE INDEX "WhatsappMessage_whatsappAccountId_createdAt_idx" ON "WhatsappMessage"("whatsappAccountId","createdAt");

CREATE TABLE "WhatsappWebhookEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "whatsappAccountId" TEXT NOT NULL,
  "provider" VARCHAR(64) NOT NULL DEFAULT 'META_OFFICIAL',
  "eventType" VARCHAR(64) NOT NULL,
  "deduplicationKey" VARCHAR(255) NOT NULL,
  "externalMessageId" VARCHAR(255),
  "status" "WhatsappWebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
  "sanitizedPayload" JSONB,
  "errorMessage" VARCHAR(500),
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  CONSTRAINT "WhatsappWebhookEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id"),
  CONSTRAINT "WhatsappWebhookEvent_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "WhatsappAccount"("id")
);
CREATE UNIQUE INDEX "WhatsappWebhookEvent_organizationId_whatsappAccountId_deduplicationKey_key" ON "WhatsappWebhookEvent"("organizationId","whatsappAccountId","deduplicationKey");
CREATE INDEX "WhatsappWebhookEvent_organizationId_receivedAt_idx" ON "WhatsappWebhookEvent"("organizationId","receivedAt");
CREATE INDEX "WhatsappWebhookEvent_whatsappAccountId_status_idx" ON "WhatsappWebhookEvent"("whatsappAccountId","status");

WITH perms(code, description) AS (VALUES
 ('whatsapp:accounts:create','Criar contas oficiais WhatsApp'), ('whatsapp:accounts:read','Ler contas oficiais WhatsApp'), ('whatsapp:accounts:update','Atualizar contas oficiais WhatsApp'), ('whatsapp:accounts:archive','Arquivar contas oficiais WhatsApp'), ('whatsapp:accounts:test','Testar conexão oficial WhatsApp'),
 ('whatsapp:conversations:read','Ler conversas WhatsApp'), ('whatsapp:conversations:read-all','Ler todas conversas WhatsApp da organização'), ('whatsapp:conversations:update','Atualizar conversas WhatsApp'), ('whatsapp:conversations:assign','Atribuir conversas WhatsApp'),
 ('whatsapp:messages:read','Ler mensagens WhatsApp'), ('whatsapp:messages:send','Enviar mensagens WhatsApp individuais'), ('whatsapp:templates:read','Ler templates WhatsApp'), ('whatsapp:templates:sync','Sincronizar templates WhatsApp'), ('whatsapp:templates:manage','Gerenciar templates WhatsApp')
)
INSERT INTO "Permission" ("id", "code", "description", "createdAt", "updatedAt")
SELECT 'perm_' || replace(code, ':', '_'), code, description, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM perms
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "createdAt")
SELECT 'rp_' || r."code" || '_' || replace(p."code", ':', '_'), r."id", p."id", CURRENT_TIMESTAMP
FROM "RbacRole" r JOIN "Permission" p ON p."code" IN ('whatsapp:accounts:create','whatsapp:accounts:read','whatsapp:accounts:update','whatsapp:accounts:archive','whatsapp:accounts:test','whatsapp:conversations:read','whatsapp:conversations:read-all','whatsapp:conversations:update','whatsapp:conversations:assign','whatsapp:messages:read','whatsapp:messages:send','whatsapp:templates:read','whatsapp:templates:sync','whatsapp:templates:manage')
WHERE r."organizationId" IS NULL AND r."code" IN ('GLOBAL_ADMIN','ORG_ADMIN')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "createdAt")
SELECT 'rp_' || r."code" || '_' || replace(p."code", ':', '_'), r."id", p."id", CURRENT_TIMESTAMP
FROM "RbacRole" r JOIN "Permission" p ON p."code" IN ('whatsapp:accounts:read','whatsapp:conversations:read','whatsapp:conversations:read-all','whatsapp:conversations:update','whatsapp:conversations:assign','whatsapp:messages:read','whatsapp:messages:send','whatsapp:templates:read')
WHERE r."organizationId" IS NULL AND r."code" = 'MANAGER'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "createdAt")
SELECT 'rp_' || r."code" || '_' || replace(p."code", ':', '_'), r."id", p."id", CURRENT_TIMESTAMP
FROM "RbacRole" r JOIN "Permission" p ON p."code" IN ('whatsapp:conversations:read','whatsapp:conversations:update','whatsapp:messages:read','whatsapp:messages:send')
WHERE r."organizationId" IS NULL AND r."code" = 'BROKER'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
