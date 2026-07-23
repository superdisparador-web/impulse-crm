-- Add provider-agnostic analytics event references and a pending-event processing index.
ALTER TABLE "analytics_events" ADD COLUMN "distributionId" TEXT;
ALTER TABLE "analytics_events" ADD COLUMN "dealId" TEXT;
DROP INDEX IF EXISTS "analytics_events_organizationId_processedAt_idx";
CREATE INDEX "analytics_events_organizationId_processedAt_occurredAt_idx" ON "analytics_events"("organizationId", "processedAt", "occurredAt");
CREATE INDEX "analytics_events_organizationId_distributionId_occurredAt_idx" ON "analytics_events"("organizationId", "distributionId", "occurredAt");
CREATE INDEX "analytics_events_organizationId_dealId_occurredAt_idx" ON "analytics_events"("organizationId", "dealId", "occurredAt");
