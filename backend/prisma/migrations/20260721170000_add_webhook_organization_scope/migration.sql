ALTER TABLE "WebhookEvent" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "InboundMessage" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "MessageStatusHistory" ADD COLUMN "organizationId" TEXT;

UPDATE "WebhookEvent" AS event
SET "organizationId" = account."organizationId"
FROM "WhatsappAccount" AS account
WHERE event."whatsappAccountId" = account."id";

UPDATE "InboundMessage" AS inbound
SET "organizationId" = account."organizationId"
FROM "WhatsappAccount" AS account
WHERE inbound."whatsappAccountId" = account."id";

UPDATE "MessageStatusHistory" AS history
SET "organizationId" = account."organizationId"
FROM "WhatsappAccount" AS account
WHERE history."whatsappAccountId" = account."id";

CREATE INDEX "WebhookEvent_organizationId_idx" ON "WebhookEvent"("organizationId");
CREATE INDEX "InboundMessage_organizationId_idx" ON "InboundMessage"("organizationId");
CREATE INDEX "MessageStatusHistory_organizationId_idx" ON "MessageStatusHistory"("organizationId");

ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InboundMessage" ADD CONSTRAINT "InboundMessage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MessageStatusHistory" ADD CONSTRAINT "MessageStatusHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
