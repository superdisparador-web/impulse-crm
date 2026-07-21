CREATE TYPE "WebhookProvider" AS ENUM ('META');
CREATE TYPE "WebhookEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED');
CREATE TYPE "InboundMessageType" AS ENUM ('TEXT', 'AUDIO', 'IMAGE', 'VIDEO', 'DOCUMENT', 'LOCATION', 'CONTACT', 'STICKER', 'REACTION', 'BUTTON', 'INTERACTIVE', 'UNKNOWN');
CREATE TYPE "MetaMessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELED');

CREATE TABLE "WebhookEvent" (
  "id" TEXT NOT NULL,
  "provider" "WebhookProvider" NOT NULL DEFAULT 'META',
  "eventType" VARCHAR(64) NOT NULL,
  "status" "WebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
  "whatsappAccountId" TEXT,
  "phoneNumberId" VARCHAR(128),
  "metaMessageId" VARCHAR(255),
  "payload" JSONB NOT NULL,
  "errorMessage" TEXT,
  "signatureValid" BOOLEAN,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InboundMessage" (
  "id" TEXT NOT NULL,
  "whatsappAccountId" TEXT,
  "phoneNumberId" VARCHAR(128),
  "from" VARCHAR(64) NOT NULL,
  "customerName" VARCHAR(255),
  "metaMessageId" VARCHAR(255) NOT NULL,
  "type" "InboundMessageType" NOT NULL DEFAULT 'UNKNOWN',
  "text" TEXT,
  "payload" JSONB NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InboundMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaFile" (
  "id" TEXT NOT NULL,
  "inboundMessageId" TEXT,
  "metaMediaId" VARCHAR(255) NOT NULL,
  "type" "InboundMessageType" NOT NULL,
  "mimeType" VARCHAR(128),
  "sha256" VARCHAR(255),
  "fileName" VARCHAR(500),
  "url" TEXT,
  "downloadStatus" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MediaFile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MessageStatusHistory" (
  "id" TEXT NOT NULL,
  "whatsappAccountId" TEXT,
  "phoneNumberId" VARCHAR(128),
  "metaMessageId" VARCHAR(255) NOT NULL,
  "status" "MetaMessageStatus" NOT NULL,
  "recipientPhone" VARCHAR(64),
  "conversationId" VARCHAR(255),
  "pricing" JSONB,
  "errors" JSONB,
  "rawPayload" JSONB NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MessageStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InboundMessage_metaMessageId_key" ON "InboundMessage"("metaMessageId");
CREATE UNIQUE INDEX "MessageStatusHistory_metaMessageId_status_occurredAt_key" ON "MessageStatusHistory"("metaMessageId", "status", "occurredAt");
CREATE INDEX "WebhookEvent_provider_idx" ON "WebhookEvent"("provider");
CREATE INDEX "WebhookEvent_eventType_idx" ON "WebhookEvent"("eventType");
CREATE INDEX "WebhookEvent_status_idx" ON "WebhookEvent"("status");
CREATE INDEX "WebhookEvent_whatsappAccountId_idx" ON "WebhookEvent"("whatsappAccountId");
CREATE INDEX "WebhookEvent_phoneNumberId_idx" ON "WebhookEvent"("phoneNumberId");
CREATE INDEX "WebhookEvent_metaMessageId_idx" ON "WebhookEvent"("metaMessageId");
CREATE INDEX "WebhookEvent_createdAt_idx" ON "WebhookEvent"("createdAt");
CREATE INDEX "InboundMessage_whatsappAccountId_idx" ON "InboundMessage"("whatsappAccountId");
CREATE INDEX "InboundMessage_phoneNumberId_idx" ON "InboundMessage"("phoneNumberId");
CREATE INDEX "InboundMessage_from_idx" ON "InboundMessage"("from");
CREATE INDEX "InboundMessage_type_idx" ON "InboundMessage"("type");
CREATE INDEX "InboundMessage_receivedAt_idx" ON "InboundMessage"("receivedAt");
CREATE INDEX "MediaFile_inboundMessageId_idx" ON "MediaFile"("inboundMessageId");
CREATE INDEX "MediaFile_metaMediaId_idx" ON "MediaFile"("metaMediaId");
CREATE INDEX "MediaFile_type_idx" ON "MediaFile"("type");
CREATE INDEX "MediaFile_downloadStatus_idx" ON "MediaFile"("downloadStatus");
CREATE INDEX "MessageStatusHistory_whatsappAccountId_idx" ON "MessageStatusHistory"("whatsappAccountId");
CREATE INDEX "MessageStatusHistory_phoneNumberId_idx" ON "MessageStatusHistory"("phoneNumberId");
CREATE INDEX "MessageStatusHistory_metaMessageId_idx" ON "MessageStatusHistory"("metaMessageId");
CREATE INDEX "MessageStatusHistory_status_idx" ON "MessageStatusHistory"("status");
CREATE INDEX "MessageStatusHistory_occurredAt_idx" ON "MessageStatusHistory"("occurredAt");
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "WhatsappAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InboundMessage" ADD CONSTRAINT "InboundMessage_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "WhatsappAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MediaFile" ADD CONSTRAINT "MediaFile_inboundMessageId_fkey" FOREIGN KEY ("inboundMessageId") REFERENCES "InboundMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MessageStatusHistory" ADD CONSTRAINT "MessageStatusHistory_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "WhatsappAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
