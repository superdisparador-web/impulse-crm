ALTER TABLE "User" ADD COLUMN "phone" VARCHAR(32),
ADD COLUMN "organizationId" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
