CREATE TABLE "UserPreference" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "avatarUrl" VARCHAR(500),
  "language" VARCHAR(16) NOT NULL DEFAULT 'pt-BR', "timezone" VARCHAR(80) NOT NULL DEFAULT 'America/Sao_Paulo',
  "dateFormat" VARCHAR(20) NOT NULL DEFAULT 'DD/MM/YYYY', "notifyInApp" BOOLEAN NOT NULL DEFAULT true,
  "notifyEmail" BOOLEAN NOT NULL DEFAULT true, "notifyWhatsapp" BOOLEAN NOT NULL DEFAULT false,
  "notifyNewLeads" BOOLEAN NOT NULL DEFAULT true, "notifySla" BOOLEAN NOT NULL DEFAULT true,
  "notifyCampaigns" BOOLEAN NOT NULL DEFAULT true, "notifySecurity" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "OrganizationSetting" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "displayName" VARCHAR(255), "logoUrl" VARCHAR(500),
  "faviconUrl" VARCHAR(500), "primaryColor" VARCHAR(7) NOT NULL DEFAULT '#2563eb', "secondaryColor" VARCHAR(7) NOT NULL DEFAULT '#0f172a',
  "signature" VARCHAR(500), "footer" VARCHAR(500), "businessStartsAt" VARCHAR(5) NOT NULL DEFAULT '08:00',
  "businessEndsAt" VARCHAR(5) NOT NULL DEFAULT '18:00', "dailyLeadLimit" INTEGER, "slaMinutes" INTEGER NOT NULL DEFAULT 15,
  "contactAttempts" INTEGER NOT NULL DEFAULT 3, "redistributionMinutes" INTEGER NOT NULL DEFAULT 30, "roundRobin" BOOLEAN NOT NULL DEFAULT true,
  "notifyLeadFailures" BOOLEAN NOT NULL DEFAULT true, "notifyWhatsappHealth" BOOLEAN NOT NULL DEFAULT true,
  "sessionTtlMinutes" INTEGER NOT NULL DEFAULT 480, "maxLoginAttempts" INTEGER NOT NULL DEFAULT 5,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationSetting_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OrganizationSetting_organizationId_key" ON "OrganizationSetting"("organizationId");
ALTER TABLE "OrganizationSetting" ADD CONSTRAINT "OrganizationSetting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SystemSetting" (
  "key" VARCHAR(40) NOT NULL DEFAULT 'global', "defaultSessionMinutes" INTEGER NOT NULL DEFAULT 480,
  "defaultLeadLimit" INTEGER, "maintenanceMode" BOOLEAN NOT NULL DEFAULT false, "allowOrganizationBranding" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);
