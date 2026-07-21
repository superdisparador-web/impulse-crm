CREATE TYPE "QueueStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELED');
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

CREATE TABLE "MessageQueue" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "campaignId" TEXT,
  "campaignRecipientId" TEXT,
  "whatsappAccountId" TEXT,
  "messageId" VARCHAR(255),
  "phone" VARCHAR(32) NOT NULL,
  "payload" JSONB,
  "status" "QueueStatus" NOT NULL DEFAULT 'PENDING',
  "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
  "scheduledAt" TIMESTAMP(3),
  "processedAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "readAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MessageQueue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MessageLog" (
  "id" TEXT NOT NULL,
  "messageQueueId" TEXT,
  "campaignId" TEXT,
  "campaignRecipientId" TEXT,
  "messageId" VARCHAR(255),
  "status" "QueueStatus" NOT NULL,
  "description" VARCHAR(500),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MessageLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MessageQueue_organizationId_idx" ON "MessageQueue"("organizationId");
CREATE INDEX "MessageQueue_campaignId_idx" ON "MessageQueue"("campaignId");
CREATE INDEX "MessageQueue_campaignRecipientId_idx" ON "MessageQueue"("campaignRecipientId");
CREATE INDEX "MessageQueue_whatsappAccountId_idx" ON "MessageQueue"("whatsappAccountId");
CREATE INDEX "MessageQueue_messageId_idx" ON "MessageQueue"("messageId");
CREATE INDEX "MessageQueue_status_idx" ON "MessageQueue"("status");
CREATE INDEX "MessageQueue_priority_idx" ON "MessageQueue"("priority");
CREATE INDEX "MessageQueue_scheduledAt_idx" ON "MessageQueue"("scheduledAt");
CREATE INDEX "MessageQueue_createdAt_idx" ON "MessageQueue"("createdAt");
CREATE INDEX "MessageLog_messageQueueId_idx" ON "MessageLog"("messageQueueId");
CREATE INDEX "MessageLog_campaignId_idx" ON "MessageLog"("campaignId");
CREATE INDEX "MessageLog_campaignRecipientId_idx" ON "MessageLog"("campaignRecipientId");
CREATE INDEX "MessageLog_messageId_idx" ON "MessageLog"("messageId");
CREATE INDEX "MessageLog_status_idx" ON "MessageLog"("status");
CREATE INDEX "MessageLog_createdAt_idx" ON "MessageLog"("createdAt");

ALTER TABLE "MessageQueue" ADD CONSTRAINT "MessageQueue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MessageQueue" ADD CONSTRAINT "MessageQueue_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MessageQueue" ADD CONSTRAINT "MessageQueue_campaignRecipientId_fkey" FOREIGN KEY ("campaignRecipientId") REFERENCES "CampaignRecipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MessageQueue" ADD CONSTRAINT "MessageQueue_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "WhatsappAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_messageQueueId_fkey" FOREIGN KEY ("messageQueueId") REFERENCES "MessageQueue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_campaignRecipientId_fkey" FOREIGN KEY ("campaignRecipientId") REFERENCES "CampaignRecipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
