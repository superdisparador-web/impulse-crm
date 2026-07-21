CREATE TYPE "QueueStatus" AS ENUM ('PENDING', 'WAITING', 'PROCESSING', 'SENT', 'FAILED', 'RETRYING', 'CANCELED');
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

CREATE TABLE "MessageQueue" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "recipientId" TEXT,
  "whatsappAccountId" TEXT,
  "status" "QueueStatus" NOT NULL DEFAULT 'PENDING',
  "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
  "attempt" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MessageQueue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MessageLog" (
  "id" TEXT NOT NULL,
  "queueId" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "recipientId" TEXT,
  "status" "QueueStatus" NOT NULL,
  "message" TEXT NOT NULL,
  "response" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MessageLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MessageQueue_organizationId_idx" ON "MessageQueue"("organizationId");
CREATE INDEX "MessageQueue_campaignId_idx" ON "MessageQueue"("campaignId");
CREATE INDEX "MessageQueue_recipientId_idx" ON "MessageQueue"("recipientId");
CREATE INDEX "MessageQueue_whatsappAccountId_idx" ON "MessageQueue"("whatsappAccountId");
CREATE INDEX "MessageQueue_status_idx" ON "MessageQueue"("status");
CREATE INDEX "MessageQueue_priority_idx" ON "MessageQueue"("priority");
CREATE INDEX "MessageQueue_scheduledAt_idx" ON "MessageQueue"("scheduledAt");
CREATE INDEX "MessageQueue_createdAt_idx" ON "MessageQueue"("createdAt");
CREATE INDEX "MessageLog_queueId_idx" ON "MessageLog"("queueId");
CREATE INDEX "MessageLog_campaignId_idx" ON "MessageLog"("campaignId");
CREATE INDEX "MessageLog_recipientId_idx" ON "MessageLog"("recipientId");
CREATE INDEX "MessageLog_status_idx" ON "MessageLog"("status");
CREATE INDEX "MessageLog_createdAt_idx" ON "MessageLog"("createdAt");

ALTER TABLE "MessageQueue" ADD CONSTRAINT "MessageQueue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MessageQueue" ADD CONSTRAINT "MessageQueue_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageQueue" ADD CONSTRAINT "MessageQueue_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "CampaignRecipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MessageQueue" ADD CONSTRAINT "MessageQueue_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "WhatsappAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "MessageQueue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "CampaignRecipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
