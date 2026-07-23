ALTER TABLE "MessageLog" ADD COLUMN "organizationId" TEXT;

UPDATE "MessageLog" log
SET "organizationId" = queue."organizationId"
FROM "MessageQueue" queue
WHERE log."queueId" = queue."id";

CREATE INDEX "MessageLog_organizationId_idx" ON "MessageLog"("organizationId");
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
