CREATE TABLE "WhatsappEmbeddedSignupState" (
    "id" TEXT NOT NULL,
    "stateHash" CHAR(64) NOT NULL,
    "authorizationCodeHash" CHAR(64),
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WhatsappEmbeddedSignupState_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WhatsappEmbeddedSignupState_stateHash_key" ON "WhatsappEmbeddedSignupState"("stateHash");
CREATE UNIQUE INDEX "WhatsappEmbeddedSignupState_authorizationCodeHash_key" ON "WhatsappEmbeddedSignupState"("authorizationCodeHash");
CREATE INDEX "WhatsappEmbeddedSignupState_organizationId_expiresAt_idx" ON "WhatsappEmbeddedSignupState"("organizationId", "expiresAt");
CREATE INDEX "WhatsappEmbeddedSignupState_userId_expiresAt_idx" ON "WhatsappEmbeddedSignupState"("userId", "expiresAt");
ALTER TABLE "WhatsappEmbeddedSignupState" ADD CONSTRAINT "WhatsappEmbeddedSignupState_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WhatsappEmbeddedSignupState" ADD CONSTRAINT "WhatsappEmbeddedSignupState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
