CREATE TYPE "RefreshTokenStatus" AS ENUM ('ACTIVE', 'ROTATED', 'REVOKED', 'EXPIRED');
CREATE TYPE "AuthAuditEventType" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT', 'LOGOUT_ALL', 'REFRESH_SUCCESS', 'REFRESH_FAILURE', 'PASSWORD_CHANGED');

CREATE TABLE "AuthSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "device" VARCHAR(160),
  "ipAddress" VARCHAR(64),
  "userAgent" VARCHAR(512),
  CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RefreshToken" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "status" "RefreshTokenStatus" NOT NULL DEFAULT 'ACTIVE',
  "replacedByTokenId" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthAuditLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "organizationId" TEXT,
  "eventType" "AuthAuditEventType" NOT NULL,
  "success" BOOLEAN NOT NULL DEFAULT true,
  "ipAddress" VARCHAR(64),
  "userAgent" VARCHAR(512),
  "reason" VARCHAR(160),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "AuthSession_userId_revokedAt_expiresAt_idx" ON "AuthSession"("userId", "revokedAt", "expiresAt");
CREATE INDEX "RefreshToken_userId_status_expiresAt_idx" ON "RefreshToken"("userId", "status", "expiresAt");
CREATE INDEX "RefreshToken_sessionId_status_idx" ON "RefreshToken"("sessionId", "status");
CREATE INDEX "AuthAuditLog_userId_createdAt_idx" ON "AuthAuditLog"("userId", "createdAt");
CREATE INDEX "AuthAuditLog_organizationId_createdAt_idx" ON "AuthAuditLog"("organizationId", "createdAt");
CREATE INDEX "AuthAuditLog_eventType_createdAt_idx" ON "AuthAuditLog"("eventType", "createdAt");
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AuthSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuthAuditLog" ADD CONSTRAINT "AuthAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
