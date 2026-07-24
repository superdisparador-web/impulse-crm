-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DeviceMessage" AS ENUM ('ios', 'android', 'web', 'unknown', 'desktop');

-- CreateEnum
CREATE TYPE "DifyBotType" AS ENUM ('chatBot', 'textGenerator', 'agent', 'workflow');

-- CreateEnum
CREATE TYPE "InstanceConnectionStatus" AS ENUM ('open', 'close', 'connecting');

-- CreateEnum
CREATE TYPE "OpenaiBotType" AS ENUM ('assistant', 'chatCompletion');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('opened', 'closed', 'paused');

-- CreateEnum
CREATE TYPE "TriggerOperator" AS ENUM ('contains', 'equals', 'startsWith', 'endsWith', 'regex');

-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('all', 'keyword', 'none', 'advanced');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CORRETOR', 'GLOBAL_ADMIN', 'ORG_ADMIN', 'MANAGER', 'BROKER');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('MANUAL', 'IMPORT', 'WHATSAPP', 'CAMPAIGN', 'CSV_IMPORT', 'META_ADS', 'WEBSITE', 'PUBLIC_API', 'WEBHOOK', 'REFERRAL', 'ORGANIC', 'FACEBOOK', 'INSTAGRAM', 'LANDING_PAGE', 'PHONE', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'ASSIGNED', 'CONTACT_PENDING', 'IN_CONTACT', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'LOST', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LeadTemperature" AS ENUM ('COLD', 'WARM', 'HOT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "LeadEventType" AS ENUM ('LEAD_CREATED', 'LEAD_UPDATED', 'LEAD_ASSIGNED', 'LEAD_UNASSIGNED', 'LEAD_STATUS_CHANGED', 'LEAD_TEMPERATURE_CHANGED', 'LEAD_ARCHIVED', 'LEAD_RESTORED', 'LEAD_MANAGER_CHANGED', 'LEAD_CONVERTED', 'LEAD_LOST', 'LEAD_DUPLICATE_DETECTED', 'LEAD_ACTIVITY_CREATED', 'LEAD_ACTIVITY_UPDATED', 'LEAD_ACTIVITY_COMPLETED');

-- CreateEnum
CREATE TYPE "LeadActivityStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "LeadActivityPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "LeadHistoryAction" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'TEMPERATURE_CHANGED', 'ASSIGNED', 'UNASSIGNED', 'DELETED', 'ARCHIVED', 'RESTORED', 'MANAGER_CHANGED', 'DUPLICATE_DETECTED');

-- CreateEnum
CREATE TYPE "WhatsappAccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'DISCONNECTED', 'ERROR', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "WhatsappConversationStatus" AS ENUM ('OPEN', 'PENDING', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WhatsappMessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "WhatsappMessageType" AS ENUM ('TEXT', 'TEMPLATE', 'IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO', 'LOCATION', 'INTERACTIVE', 'CONTACTS', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "WhatsappMessageStatus" AS ENUM ('RECEIVED', 'PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "WhatsappTemplateStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'DISABLED');

-- CreateEnum
CREATE TYPE "WhatsappWebhookEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED_DUPLICATE');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELED', 'FAILED', 'PROCESSING');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('MARKETING', 'UTILITY', 'AUTHENTICATION');

-- CreateEnum
CREATE TYPE "CampaignFilterField" AS ENUM ('CITY', 'SOURCE', 'PIPELINE', 'STAGE', 'STATUS', 'MANAGER', 'BROKER', 'DATE', 'TEMPERATURE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CampaignFilterOperator" AS ENUM ('EQUALS', 'IN', 'BETWEEN', 'GTE', 'LTE', 'CONTAINS', 'IS');

-- CreateEnum
CREATE TYPE "CampaignRecipientStatus" AS ENUM ('PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'CLICKED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('PENDING', 'WAITING', 'PROCESSING', 'SENT', 'FAILED', 'RETRYING', 'CANCELED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('OPEN', 'WON', 'LOST', 'REOPENED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DealMovementType" AS ENUM ('CREATED', 'STAGE_CHANGED', 'PIPELINE_CHANGED', 'REOPENED');

-- CreateEnum
CREATE TYPE "DealActivityType" AS ENUM ('TASK', 'CALL', 'MEETING', 'EMAIL', 'WHATSAPP', 'NOTE', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "DealActivityStatus" AS ENUM ('OPEN', 'DONE', 'CANCELED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "StageChecklistType" AS ENUM ('DOCUMENT', 'FIELD', 'TASK', 'APPROVAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RefreshTokenStatus" AS ENUM ('ACTIVE', 'ROTATED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AuthAuditEventType" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT', 'LOGOUT_ALL', 'REFRESH_SUCCESS', 'REFRESH_FAILURE', 'PASSWORD_CHANGED');

-- CreateEnum
CREATE TYPE "DistributionListStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DistributionStrategy" AS ENUM ('ROUND_ROBIN', 'WEIGHTED', 'LEAST_ASSIGNED', 'RANDOM', 'BY_TEAM', 'BY_REGION');

-- CreateEnum
CREATE TYPE "DistributionStatus" AS ENUM ('PENDING', 'ASSIGNED', 'CONTACT_QUEUED', 'CONTACT_SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DistributionTriggerType" AS ENUM ('CAMPAIGN_BUTTON', 'WEBHOOK', 'AUTOMATION', 'MANUAL');

-- CreateEnum
CREATE TYPE "DistributionImportMode" AS ENUM ('ADD', 'REPLACE', 'UPDATE');

-- CreateEnum
CREATE TYPE "AnalyticsEventSource" AS ENUM ('LEADS', 'CAMPAIGNS', 'DISTRIBUTION', 'WHATSAPP');

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "remoteJid" VARCHAR(100) NOT NULL,
    "labels" JSONB,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6),
    "instanceId" TEXT NOT NULL,
    "name" VARCHAR(100),
    "unreadMessages" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chatwoot" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN DEFAULT true,
    "accountId" VARCHAR(100),
    "token" VARCHAR(100),
    "url" VARCHAR(500),
    "nameInbox" VARCHAR(100),
    "signMsg" BOOLEAN DEFAULT false,
    "signDelimiter" VARCHAR(100),
    "number" VARCHAR(100),
    "reopenConversation" BOOLEAN DEFAULT false,
    "conversationPending" BOOLEAN DEFAULT false,
    "mergeBrazilContacts" BOOLEAN DEFAULT false,
    "importContacts" BOOLEAN DEFAULT false,
    "importMessages" BOOLEAN DEFAULT false,
    "daysLimitImportMessages" INTEGER,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,
    "logo" VARCHAR(500),
    "organization" VARCHAR(100),
    "ignoreJids" JSONB,

    CONSTRAINT "Chatwoot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "remoteJid" VARCHAR(100) NOT NULL,
    "pushName" VARCHAR(100),
    "profilePicUrl" VARCHAR(500),
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6),
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dify" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "botType" "DifyBotType" NOT NULL,
    "apiUrl" VARCHAR(255),
    "apiKey" VARCHAR(255),
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "triggerType" "TriggerType",
    "triggerOperator" "TriggerOperator",
    "triggerValue" TEXT,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,
    "description" VARCHAR(255),
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,

    CONSTRAINT "Dify_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DifySetting" (
    "id" TEXT NOT NULL,
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "difyIdFallback" VARCHAR(100),
    "instanceId" TEXT NOT NULL,
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,

    CONSTRAINT "DifySetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evoai" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "description" VARCHAR(255),
    "agentUrl" VARCHAR(255),
    "apiKey" VARCHAR(255),
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,
    "triggerType" "TriggerType",
    "triggerOperator" "TriggerOperator",
    "triggerValue" TEXT,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "Evoai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvoaiSetting" (
    "id" TEXT NOT NULL,
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "evoaiIdFallback" VARCHAR(100),
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "EvoaiSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvolutionBot" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "description" VARCHAR(255),
    "apiUrl" VARCHAR(255),
    "apiKey" VARCHAR(255),
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "triggerType" "TriggerType",
    "triggerOperator" "TriggerOperator",
    "triggerValue" TEXT,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,

    CONSTRAINT "EvolutionBot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvolutionBotSetting" (
    "id" TEXT NOT NULL,
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "botIdFallback" VARCHAR(100),
    "instanceId" TEXT NOT NULL,
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,

    CONSTRAINT "EvolutionBotSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flowise" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "description" VARCHAR(255),
    "apiUrl" VARCHAR(255),
    "apiKey" VARCHAR(255),
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "triggerType" "TriggerType",
    "triggerOperator" "TriggerOperator",
    "triggerValue" TEXT,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,

    CONSTRAINT "Flowise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowiseSetting" (
    "id" TEXT NOT NULL,
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "flowiseIdFallback" VARCHAR(100),
    "instanceId" TEXT NOT NULL,
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,

    CONSTRAINT "FlowiseSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Instance" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "connectionStatus" "InstanceConnectionStatus" NOT NULL DEFAULT 'open',
    "ownerJid" VARCHAR(100),
    "profilePicUrl" VARCHAR(500),
    "integration" VARCHAR(100),
    "number" VARCHAR(100),
    "token" VARCHAR(255),
    "clientName" VARCHAR(100),
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6),
    "profileName" VARCHAR(100),
    "businessId" VARCHAR(100),
    "disconnectionAt" TIMESTAMP(6),
    "disconnectionObject" JSONB,
    "disconnectionReasonCode" INTEGER,

    CONSTRAINT "Instance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationSession" (
    "id" TEXT NOT NULL,
    "sessionId" VARCHAR(255) NOT NULL,
    "remoteJid" VARCHAR(100) NOT NULL,
    "pushName" TEXT,
    "status" "SessionStatus" NOT NULL,
    "awaitUser" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,
    "parameters" JSONB,
    "context" JSONB,
    "botId" TEXT,
    "type" VARCHAR(100),

    CONSTRAINT "IntegrationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IsOnWhatsapp" (
    "id" TEXT NOT NULL,
    "remoteJid" VARCHAR(100) NOT NULL,
    "jidOptions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "lid" VARCHAR(100),

    CONSTRAINT "IsOnWhatsapp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kafka" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "events" JSONB NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "Kafka_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Label" (
    "id" TEXT NOT NULL,
    "labelId" VARCHAR(100),
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(100) NOT NULL,
    "predefinedId" VARCHAR(100),
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "fileName" VARCHAR(500) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "mimetype" VARCHAR(100) NOT NULL,
    "createdAt" DATE DEFAULT CURRENT_TIMESTAMP,
    "messageId" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "key" JSONB NOT NULL,
    "pushName" VARCHAR(100),
    "participant" VARCHAR(100),
    "messageType" VARCHAR(100) NOT NULL,
    "message" JSONB NOT NULL,
    "contextInfo" JSONB,
    "source" "DeviceMessage" NOT NULL,
    "messageTimestamp" INTEGER NOT NULL,
    "chatwootMessageId" INTEGER,
    "chatwootInboxId" INTEGER,
    "chatwootConversationId" INTEGER,
    "chatwootContactInboxSourceId" VARCHAR(100),
    "chatwootIsRead" BOOLEAN,
    "instanceId" TEXT NOT NULL,
    "webhookUrl" VARCHAR(500),
    "sessionId" TEXT,
    "status" VARCHAR(30),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageUpdate" (
    "id" TEXT NOT NULL,
    "keyId" VARCHAR(100) NOT NULL,
    "remoteJid" VARCHAR(100) NOT NULL,
    "fromMe" BOOLEAN NOT NULL,
    "participant" VARCHAR(100),
    "pollUpdates" JSONB,
    "status" VARCHAR(30) NOT NULL,
    "messageId" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "MessageUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "N8n" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "description" VARCHAR(255),
    "webhookUrl" VARCHAR(255),
    "basicAuthUser" VARCHAR(255),
    "basicAuthPass" VARCHAR(255),
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,
    "triggerType" "TriggerType",
    "triggerOperator" "TriggerOperator",
    "triggerValue" TEXT,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "N8n_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "N8nSetting" (
    "id" TEXT NOT NULL,
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "n8nIdFallback" VARCHAR(100),
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "N8nSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nats" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "events" JSONB NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "Nats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpenaiBot" (
    "id" TEXT NOT NULL,
    "assistantId" VARCHAR(255),
    "model" VARCHAR(100),
    "systemMessages" JSONB,
    "assistantMessages" JSONB,
    "userMessages" JSONB,
    "maxTokens" INTEGER,
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "triggerType" "TriggerType",
    "triggerOperator" "TriggerOperator",
    "triggerValue" TEXT,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "openaiCredsId" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "botType" "OpenaiBotType" NOT NULL,
    "description" VARCHAR(255),
    "functionUrl" VARCHAR(500),
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,

    CONSTRAINT "OpenaiBot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpenaiCreds" (
    "id" TEXT NOT NULL,
    "apiKey" VARCHAR(255),
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,
    "name" VARCHAR(255),

    CONSTRAINT "OpenaiCreds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpenaiSetting" (
    "id" TEXT NOT NULL,
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "openaiCredsId" TEXT NOT NULL,
    "openaiIdFallback" VARCHAR(100),
    "instanceId" TEXT NOT NULL,
    "speechToText" BOOLEAN DEFAULT false,
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,

    CONSTRAINT "OpenaiSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proxy" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "host" VARCHAR(100) NOT NULL,
    "port" VARCHAR(100) NOT NULL,
    "protocol" VARCHAR(100) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "Proxy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pusher" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "appId" VARCHAR(100) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "secret" VARCHAR(100) NOT NULL,
    "cluster" VARCHAR(100) NOT NULL,
    "useTLS" BOOLEAN NOT NULL DEFAULT false,
    "events" JSONB NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "Pusher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rabbitmq" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "events" JSONB NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "Rabbitmq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "creds" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "rejectCall" BOOLEAN NOT NULL DEFAULT false,
    "msgCall" VARCHAR(100),
    "groupsIgnore" BOOLEAN NOT NULL DEFAULT false,
    "alwaysOnline" BOOLEAN NOT NULL DEFAULT false,
    "readMessages" BOOLEAN NOT NULL DEFAULT false,
    "readStatus" BOOLEAN NOT NULL DEFAULT false,
    "syncFullHistory" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,
    "wavoipToken" VARCHAR(100),

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sqs" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "events" JSONB NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "Sqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "templateId" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "template" JSONB NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,
    "webhookUrl" VARCHAR(500),

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Typebot" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "url" VARCHAR(500) NOT NULL,
    "typebot" VARCHAR(100) NOT NULL,
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6),
    "triggerType" "TriggerType",
    "triggerOperator" "TriggerOperator",
    "triggerValue" TEXT,
    "instanceId" TEXT NOT NULL,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "description" VARCHAR(255),
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,

    CONSTRAINT "Typebot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypebotSetting" (
    "id" TEXT NOT NULL,
    "expire" INTEGER DEFAULT 0,
    "keywordFinish" VARCHAR(100),
    "delayMessage" INTEGER,
    "unknownMessage" VARCHAR(100),
    "listeningFromMe" BOOLEAN DEFAULT false,
    "stopBotFromMe" BOOLEAN DEFAULT false,
    "keepOpen" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,
    "debounceTime" INTEGER,
    "typebotIdFallback" VARCHAR(100),
    "ignoreJids" JSONB,
    "splitMessages" BOOLEAN DEFAULT false,
    "timePerChar" INTEGER DEFAULT 50,

    CONSTRAINT "TypebotSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "enabled" BOOLEAN DEFAULT true,
    "events" JSONB,
    "webhookByEvents" BOOLEAN DEFAULT false,
    "webhookBase64" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,
    "headers" JSONB,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Websocket" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "events" JSONB NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "instanceId" TEXT NOT NULL,

    CONSTRAINT "Websocket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "legalName" VARCHAR(255),
    "document" VARCHAR(32),
    "slug" VARCHAR(120) NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "timezone" VARCHAR(80) NOT NULL DEFAULT 'America/Sao_Paulo',
    "locale" VARCHAR(16) NOT NULL DEFAULT 'pt-BR',
    "email" VARCHAR(255),
    "phone" VARCHAR(32),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" VARCHAR(32),
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RbacRole" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(255),
    "system" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RbacRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(120) NOT NULL,
    "description" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phoneNumber" VARCHAR(32) NOT NULL,
    "normalizedPhone" VARCHAR(32) NOT NULL,
    "displayPhoneNumber" VARCHAR(64),
    "verifiedName" VARCHAR(255),
    "phoneNumberId" VARCHAR(128) NOT NULL,
    "businessAccountId" VARCHAR(128) NOT NULL,
    "appId" VARCHAR(128),
    "accessToken" TEXT NOT NULL,
    "verifyToken" TEXT NOT NULL,
    "appSecret" TEXT,
    "webhookSecret" TEXT,
    "apiVersion" VARCHAR(16),
    "qualityRating" VARCHAR(64),
    "messagingLimitTier" VARCHAR(64),
    "status" "WhatsappAccountStatus" NOT NULL DEFAULT 'PENDING',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "connectedAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "lastConnectionTestAt" TIMESTAMP(3),
    "lastConnectionError" VARCHAR(500),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WhatsappAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "whatsappAccountId" TEXT,
    "externalTemplateId" VARCHAR(128),
    "metaTemplateId" VARCHAR(128),
    "name" VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(255) NOT NULL,
    "metaName" VARCHAR(255) NOT NULL,
    "category" VARCHAR(64) NOT NULL,
    "language" VARCHAR(16) NOT NULL,
    "status" "WhatsappTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "headerType" VARCHAR(32) NOT NULL DEFAULT 'NONE',
    "headerText" VARCHAR(255),
    "body" TEXT NOT NULL,
    "footer" VARCHAR(255),
    "buttons" JSONB,
    "components" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "parameterSchema" JSONB,
    "rejectionReason" VARCHAR(500),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WhatsappTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappConversation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "whatsappAccountId" TEXT NOT NULL,
    "leadId" TEXT,
    "contactPhone" VARCHAR(32) NOT NULL,
    "normalizedPhone" VARCHAR(32) NOT NULL,
    "contactName" VARCHAR(255),
    "status" "WhatsappConversationStatus" NOT NULL DEFAULT 'OPEN',
    "assignedUserId" TEXT,
    "managerUserId" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "lastInboundAt" TIMESTAMP(3),
    "lastOutboundAt" TIMESTAMP(3),
    "customerServiceWindowEndsAt" TIMESTAMP(3),
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WhatsappConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappMessage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "whatsappAccountId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "leadId" TEXT,
    "externalMessageId" VARCHAR(255),
    "direction" "WhatsappMessageDirection" NOT NULL,
    "type" "WhatsappMessageType" NOT NULL,
    "status" "WhatsappMessageStatus" NOT NULL,
    "senderPhone" VARCHAR(32) NOT NULL,
    "recipientPhone" VARCHAR(32) NOT NULL,
    "text" TEXT,
    "mediaId" VARCHAR(255),
    "mediaUrl" VARCHAR(1000),
    "mimeType" VARCHAR(128),
    "fileName" VARCHAR(255),
    "templateName" VARCHAR(255),
    "templateLanguage" VARCHAR(16),
    "replyToExternalMessageId" VARCHAR(255),
    "errorCode" VARCHAR(128),
    "errorMessage" VARCHAR(500),
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappWebhookEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "whatsappAccountId" TEXT NOT NULL,
    "provider" VARCHAR(64) NOT NULL DEFAULT 'META_OFFICIAL',
    "eventType" VARCHAR(64) NOT NULL,
    "deduplicationKey" VARCHAR(255) NOT NULL,
    "externalMessageId" VARCHAR(255),
    "status" "WhatsappWebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "sanitizedPayload" JSONB,
    "errorMessage" VARCHAR(500),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WhatsappWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255),
    "phone" VARCHAR(32),
    "normalizedPhone" VARCHAR(32),
    "email" VARCHAR(255),
    "normalizedEmail" VARCHAR(255),
    "document" VARCHAR(64),
    "source" "LeadSource" NOT NULL DEFAULT 'MANUAL',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "temperature" "LeadTemperature" NOT NULL DEFAULT 'UNKNOWN',
    "score" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "organizationId" TEXT NOT NULL,
    "assignedUserId" TEXT,
    "managerUserId" TEXT,
    "createdByUserId" TEXT,
    "lastAssignedAt" TIMESTAMP(3),
    "lastInteractionAt" TIMESTAMP(3),
    "lastContactAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadExternalIdentity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" VARCHAR(64) NOT NULL,
    "externalId" VARCHAR(255) NOT NULL,
    "externalAccountId" VARCHAR(255),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadExternalIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadEvent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventType" "LeadEventType" NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "payload" JSONB,
    "actorUserId" TEXT,
    "requestId" TEXT,
    "idempotencyKey" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "LeadActivityStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "LeadActivityPriority" NOT NULL DEFAULT 'MEDIUM',
    "note" TEXT,
    "completedAt" TIMESTAMP(3),
    "responsibleUserId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadHistory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "action" "LeadHistoryAction" NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "performedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "campaignType" "CampaignType" NOT NULL DEFAULT 'MARKETING',
    "archivedAt" TIMESTAMP(3),
    "whatsappAccountId" TEXT,
    "whatsappTemplateId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "totalContacts" INTEGER NOT NULL DEFAULT 0,
    "totalQueued" INTEGER NOT NULL DEFAULT 0,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalDelivered" INTEGER NOT NULL DEFAULT 0,
    "totalRead" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "totalClicked" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignFilter" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "field" "CampaignFilterField" NOT NULL,
    "operator" "CampaignFilterOperator" NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignFilter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignRecipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "leadId" TEXT,
    "phone" VARCHAR(32) NOT NULL,
    "name" VARCHAR(255),
    "status" "CampaignRecipientStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "messageId" VARCHAR(255),
    "assignedUserId" TEXT,
    "queuedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "MessageLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "queueId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "recipientId" TEXT,
    "status" "QueueStatus" NOT NULL,
    "message" TEXT NOT NULL,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pipeline" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'BRL',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Pipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineStage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "probability" INTEGER NOT NULL DEFAULT 0,
    "slaHours" INTEGER,
    "isInitial" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "color" VARCHAR(32),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineLead" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "enteredStageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PipelineLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageChecklist" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "StageChecklistType" NOT NULL DEFAULT 'CUSTOM',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "StageChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineLossReason" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "pipelineId" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "PipelineLossReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "ownerId" TEXT,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "DealStatus" NOT NULL DEFAULT 'OPEN',
    "estimatedValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "closedValue" DECIMAL(18,2),
    "currency" VARCHAR(8) NOT NULL DEFAULT 'BRL',
    "expectedCloseDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "wonAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3),
    "lossReasonId" TEXT,
    "currentStageEnteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMovementAt" TIMESTAMP(3),
    "probabilityOverride" INTEGER,
    "source" VARCHAR(128),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealStageMovement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "fromStageId" TEXT,
    "toStageId" TEXT NOT NULL,
    "movedByUserId" TEXT,
    "movementType" "DealMovementType" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealStageMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dealId" TEXT,
    "eventType" VARCHAR(100) NOT NULL,
    "actorUserId" TEXT,
    "payload" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealAssignment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "fromUserId" TEXT,
    "toUserId" TEXT,
    "assignedByUserId" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "color" VARCHAR(32),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealTag" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealActivity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "leadId" TEXT,
    "assignedToUserId" TEXT,
    "createdByUserId" TEXT,
    "type" "DealActivityType" NOT NULL,
    "status" "DealActivityStatus" NOT NULL DEFAULT 'OPEN',
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "externalCalendarEventId" TEXT,
    "externalMessageId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "DealActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "module" VARCHAR(80) NOT NULL,
    "entityType" VARCHAR(120) NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" VARCHAR(160) NOT NULL,
    "actorUserId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "ipAddress" VARCHAR(64),
    "userAgent" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "DistributionList" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "DistributionListStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DistributionList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "distributionListId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phoneE164" VARCHAR(32) NOT NULL,
    "position" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DistributionMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionCursor" (
    "organizationId" TEXT NOT NULL,
    "distributionListId" TEXT NOT NULL,
    "lastMemberId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistributionCursor_pkey" PRIMARY KEY ("organizationId","distributionListId")
);

-- CreateTable
CREATE TABLE "LeadDistribution" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "campaignId" TEXT,
    "distributionListId" TEXT NOT NULL,
    "distributionMemberId" TEXT,
    "leadId" TEXT,
    "recipientPhoneE164" VARCHAR(32) NOT NULL,
    "triggerType" "DistributionTriggerType" NOT NULL DEFAULT 'CAMPAIGN_BUTTON',
    "triggerId" VARCHAR(255),
    "webhookEventId" VARCHAR(255),
    "status" "DistributionStatus" NOT NULL DEFAULT 'PENDING',
    "strategy" "DistributionStrategy" NOT NULL DEFAULT 'ROUND_ROBIN',
    "idempotencyKey" VARCHAR(500) NOT NULL,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "messagePayload" JSONB,
    "distributedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "source" "AnalyticsEventSource" NOT NULL,
    "eventType" VARCHAR(120) NOT NULL,
    "leadId" TEXT,
    "campaignId" TEXT,
    "brokerUserId" TEXT,
    "managerUserId" TEXT,
    "whatsappAccountId" TEXT,
    "distributionId" TEXT,
    "dealId" TEXT,
    "idempotencyKey" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_metrics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bucketStart" DATE NOT NULL,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "campaigns" INTEGER NOT NULL DEFAULT 0,
    "distributions" INTEGER NOT NULL DEFAULT 0,
    "whatsappSent" INTEGER NOT NULL DEFAULT 0,
    "whatsappRead" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hourly_metrics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bucketStart" TIMESTAMP(3) NOT NULL,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "campaigns" INTEGER NOT NULL DEFAULT 0,
    "distributions" INTEGER NOT NULL DEFAULT 0,
    "whatsappSent" INTEGER NOT NULL DEFAULT 0,
    "whatsappRead" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hourly_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_metrics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "bucketStart" DATE NOT NULL,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "opened" INTEGER NOT NULL DEFAULT 0,
    "clicked" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_metrics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "brokerUserId" TEXT NOT NULL,
    "bucketStart" DATE NOT NULL,
    "assignedLeads" INTEGER NOT NULL DEFAULT 0,
    "contactedLeads" INTEGER NOT NULL DEFAULT 0,
    "wonDeals" INTEGER NOT NULL DEFAULT 0,
    "lostDeals" INTEGER NOT NULL DEFAULT 0,
    "activities" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manager_metrics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "managerUserId" TEXT NOT NULL,
    "bucketStart" DATE NOT NULL,
    "managedLeads" INTEGER NOT NULL DEFAULT 0,
    "assignedLeads" INTEGER NOT NULL DEFAULT 0,
    "activeBrokers" INTEGER NOT NULL DEFAULT 0,
    "wonDeals" INTEGER NOT NULL DEFAULT 0,
    "lostDeals" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manager_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_metrics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "whatsappAccountId" TEXT,
    "bucketStart" DATE NOT NULL,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "read" INTEGER NOT NULL DEFAULT 0,
    "received" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "conversations" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Chat_instanceId_idx" ON "Chat"("instanceId");

-- CreateIndex
CREATE INDEX "Chat_remoteJid_idx" ON "Chat"("remoteJid");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_instanceId_remoteJid_key" ON "Chat"("instanceId", "remoteJid");

-- CreateIndex
CREATE UNIQUE INDEX "Chatwoot_instanceId_key" ON "Chatwoot"("instanceId");

-- CreateIndex
CREATE INDEX "Contact_instanceId_idx" ON "Contact"("instanceId");

-- CreateIndex
CREATE INDEX "Contact_remoteJid_idx" ON "Contact"("remoteJid");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_remoteJid_instanceId_key" ON "Contact"("remoteJid", "instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "DifySetting_instanceId_key" ON "DifySetting"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "EvoaiSetting_instanceId_key" ON "EvoaiSetting"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "EvolutionBotSetting_instanceId_key" ON "EvolutionBotSetting"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "FlowiseSetting_instanceId_key" ON "FlowiseSetting"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Instance_name_key" ON "Instance"("name");

-- CreateIndex
CREATE UNIQUE INDEX "IsOnWhatsapp_remoteJid_key" ON "IsOnWhatsapp"("remoteJid");

-- CreateIndex
CREATE UNIQUE INDEX "Kafka_instanceId_key" ON "Kafka"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Label_labelId_instanceId_key" ON "Label"("labelId", "instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Media_messageId_key" ON "Media"("messageId");

-- CreateIndex
CREATE INDEX "Message_instanceId_idx" ON "Message"("instanceId");

-- CreateIndex
CREATE INDEX "MessageUpdate_instanceId_idx" ON "MessageUpdate"("instanceId");

-- CreateIndex
CREATE INDEX "MessageUpdate_messageId_idx" ON "MessageUpdate"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "N8nSetting_instanceId_key" ON "N8nSetting"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Nats_instanceId_key" ON "Nats"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "OpenaiCreds_apiKey_key" ON "OpenaiCreds"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "OpenaiCreds_name_key" ON "OpenaiCreds"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OpenaiSetting_openaiCredsId_key" ON "OpenaiSetting"("openaiCredsId");

-- CreateIndex
CREATE UNIQUE INDEX "OpenaiSetting_instanceId_key" ON "OpenaiSetting"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Proxy_instanceId_key" ON "Proxy"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Pusher_instanceId_key" ON "Pusher"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Rabbitmq_instanceId_key" ON "Rabbitmq"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionId_key" ON "Session"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_instanceId_key" ON "Setting"("instanceId");

-- CreateIndex
CREATE INDEX "Setting_instanceId_idx" ON "Setting"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Sqs_instanceId_key" ON "Sqs"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Template_templateId_key" ON "Template"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "Template_name_key" ON "Template"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TypebotSetting_instanceId_key" ON "TypebotSetting"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Webhook_instanceId_key" ON "Webhook"("instanceId");

-- CreateIndex
CREATE INDEX "Webhook_instanceId_idx" ON "Webhook"("instanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Websocket_instanceId_key" ON "Websocket"("instanceId");

-- CreateIndex
CREATE INDEX "Organization_name_idx" ON "Organization"("name");

-- CreateIndex
CREATE INDEX "Organization_document_idx" ON "Organization"("document");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE INDEX "Organization_deletedAt_idx" ON "Organization"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "User_organizationId_status_idx" ON "User"("organizationId", "status");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "RbacRole_organizationId_idx" ON "RbacRole"("organizationId");

-- CreateIndex
CREATE INDEX "RbacRole_deletedAt_idx" ON "RbacRole"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RbacRole_organizationId_code_key" ON "RbacRole"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "Permission_code_idx" ON "Permission"("code");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappAccount_phoneNumberId_key" ON "WhatsappAccount"("phoneNumberId");

-- CreateIndex
CREATE INDEX "WhatsappAccount_organizationId_status_idx" ON "WhatsappAccount"("organizationId", "status");

-- CreateIndex
CREATE INDEX "WhatsappAccount_organizationId_isDefault_idx" ON "WhatsappAccount"("organizationId", "isDefault");

-- CreateIndex
CREATE INDEX "WhatsappAccount_organizationId_normalizedPhone_idx" ON "WhatsappAccount"("organizationId", "normalizedPhone");

-- CreateIndex
CREATE INDEX "WhatsappAccount_businessAccountId_idx" ON "WhatsappAccount"("businessAccountId");

-- CreateIndex
CREATE INDEX "WhatsappAccount_deletedAt_idx" ON "WhatsappAccount"("deletedAt");

-- CreateIndex
CREATE INDEX "WhatsappTemplate_organizationId_status_idx" ON "WhatsappTemplate"("organizationId", "status");

-- CreateIndex
CREATE INDEX "WhatsappTemplate_organizationId_category_idx" ON "WhatsappTemplate"("organizationId", "category");

-- CreateIndex
CREATE INDEX "WhatsappTemplate_organizationId_language_idx" ON "WhatsappTemplate"("organizationId", "language");

-- CreateIndex
CREATE INDEX "WhatsappTemplate_organizationId_isActive_idx" ON "WhatsappTemplate"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "WhatsappTemplate_whatsappAccountId_idx" ON "WhatsappTemplate"("whatsappAccountId");

-- CreateIndex
CREATE INDEX "WhatsappTemplate_deletedAt_idx" ON "WhatsappTemplate"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappTemplate_organizationId_whatsappAccountId_name_lang_key" ON "WhatsappTemplate"("organizationId", "whatsappAccountId", "name", "language");

-- CreateIndex
CREATE INDEX "WhatsappConversation_whatsappAccountId_normalizedPhone_idx" ON "WhatsappConversation"("whatsappAccountId", "normalizedPhone");

-- CreateIndex
CREATE INDEX "WhatsappConversation_organizationId_status_lastMessageAt_idx" ON "WhatsappConversation"("organizationId", "status", "lastMessageAt");

-- CreateIndex
CREATE INDEX "WhatsappConversation_organizationId_assignedUserId_status_idx" ON "WhatsappConversation"("organizationId", "assignedUserId", "status");

-- CreateIndex
CREATE INDEX "WhatsappConversation_organizationId_leadId_idx" ON "WhatsappConversation"("organizationId", "leadId");

-- CreateIndex
CREATE INDEX "WhatsappMessage_organizationId_conversationId_createdAt_idx" ON "WhatsappMessage"("organizationId", "conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsappMessage_organizationId_status_createdAt_idx" ON "WhatsappMessage"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsappMessage_whatsappAccountId_createdAt_idx" ON "WhatsappMessage"("whatsappAccountId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappMessage_organizationId_externalMessageId_key" ON "WhatsappMessage"("organizationId", "externalMessageId");

-- CreateIndex
CREATE INDEX "WhatsappWebhookEvent_organizationId_receivedAt_idx" ON "WhatsappWebhookEvent"("organizationId", "receivedAt");

-- CreateIndex
CREATE INDEX "WhatsappWebhookEvent_whatsappAccountId_status_idx" ON "WhatsappWebhookEvent"("whatsappAccountId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappWebhookEvent_organizationId_whatsappAccountId_dedup_key" ON "WhatsappWebhookEvent"("organizationId", "whatsappAccountId", "deduplicationKey");

-- CreateIndex
CREATE INDEX "Lead_organizationId_createdAt_idx" ON "Lead"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_organizationId_updatedAt_idx" ON "Lead"("organizationId", "updatedAt");

-- CreateIndex
CREATE INDEX "Lead_organizationId_status_createdAt_idx" ON "Lead"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_organizationId_assignedUserId_status_createdAt_idx" ON "Lead"("organizationId", "assignedUserId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_organizationId_managerUserId_status_createdAt_idx" ON "Lead"("organizationId", "managerUserId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_organizationId_source_createdAt_idx" ON "Lead"("organizationId", "source", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_organizationId_normalizedPhone_idx" ON "Lead"("organizationId", "normalizedPhone");

-- CreateIndex
CREATE INDEX "Lead_organizationId_normalizedEmail_idx" ON "Lead"("organizationId", "normalizedEmail");

-- CreateIndex
CREATE INDEX "Lead_organizationId_document_idx" ON "Lead"("organizationId", "document");

-- CreateIndex
CREATE INDEX "Lead_organizationId_archivedAt_idx" ON "Lead"("organizationId", "archivedAt");

-- CreateIndex
CREATE INDEX "Lead_deletedAt_idx" ON "Lead"("deletedAt");

-- CreateIndex
CREATE INDEX "LeadExternalIdentity_organizationId_leadId_idx" ON "LeadExternalIdentity"("organizationId", "leadId");

-- CreateIndex
CREATE INDEX "LeadExternalIdentity_organizationId_provider_idx" ON "LeadExternalIdentity"("organizationId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "LeadExternalIdentity_organizationId_provider_externalAccoun_key" ON "LeadExternalIdentity"("organizationId", "provider", "externalAccountId", "externalId");

-- CreateIndex
CREATE INDEX "LeadEvent_organizationId_leadId_occurredAt_idx" ON "LeadEvent"("organizationId", "leadId", "occurredAt");

-- CreateIndex
CREATE INDEX "LeadEvent_organizationId_eventType_occurredAt_idx" ON "LeadEvent"("organizationId", "eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "LeadEvent_organizationId_actorUserId_occurredAt_idx" ON "LeadEvent"("organizationId", "actorUserId", "occurredAt");

-- CreateIndex
CREATE INDEX "LeadEvent_organizationId_requestId_idx" ON "LeadEvent"("organizationId", "requestId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadEvent_organizationId_idempotencyKey_key" ON "LeadEvent"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "LeadActivity_organizationId_leadId_dueAt_idx" ON "LeadActivity"("organizationId", "leadId", "dueAt");

-- CreateIndex
CREATE INDEX "LeadActivity_organizationId_responsibleUserId_status_dueAt_idx" ON "LeadActivity"("organizationId", "responsibleUserId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "LeadActivity_organizationId_status_priority_dueAt_idx" ON "LeadActivity"("organizationId", "status", "priority", "dueAt");

-- CreateIndex
CREATE INDEX "LeadHistory_organizationId_leadId_createdAt_idx" ON "LeadHistory"("organizationId", "leadId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadHistory_leadId_idx" ON "LeadHistory"("leadId");

-- CreateIndex
CREATE INDEX "LeadHistory_performedByUserId_idx" ON "LeadHistory"("performedByUserId");

-- CreateIndex
CREATE INDEX "LeadHistory_action_idx" ON "LeadHistory"("action");

-- CreateIndex
CREATE INDEX "LeadHistory_createdAt_idx" ON "LeadHistory"("createdAt");

-- CreateIndex
CREATE INDEX "Campaign_organizationId_idx" ON "Campaign"("organizationId");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_scheduledAt_idx" ON "Campaign"("scheduledAt");

-- CreateIndex
CREATE INDEX "Campaign_deletedAt_idx" ON "Campaign"("deletedAt");

-- CreateIndex
CREATE INDEX "Campaign_archivedAt_idx" ON "Campaign"("archivedAt");

-- CreateIndex
CREATE INDEX "Campaign_campaignType_idx" ON "Campaign"("campaignType");

-- CreateIndex
CREATE INDEX "Campaign_whatsappAccountId_idx" ON "Campaign"("whatsappAccountId");

-- CreateIndex
CREATE INDEX "Campaign_whatsappTemplateId_idx" ON "Campaign"("whatsappTemplateId");

-- CreateIndex
CREATE INDEX "Campaign_createdById_idx" ON "Campaign"("createdById");

-- CreateIndex
CREATE INDEX "CampaignFilter_campaignId_idx" ON "CampaignFilter"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignFilter_field_idx" ON "CampaignFilter"("field");

-- CreateIndex
CREATE INDEX "CampaignRecipient_campaignId_idx" ON "CampaignRecipient"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignRecipient_leadId_idx" ON "CampaignRecipient"("leadId");

-- CreateIndex
CREATE INDEX "CampaignRecipient_status_idx" ON "CampaignRecipient"("status");

-- CreateIndex
CREATE INDEX "CampaignRecipient_assignedUserId_idx" ON "CampaignRecipient"("assignedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignRecipient_campaignId_leadId_key" ON "CampaignRecipient"("campaignId", "leadId");

-- CreateIndex
CREATE INDEX "MessageQueue_organizationId_idx" ON "MessageQueue"("organizationId");

-- CreateIndex
CREATE INDEX "MessageQueue_campaignId_idx" ON "MessageQueue"("campaignId");

-- CreateIndex
CREATE INDEX "MessageQueue_recipientId_idx" ON "MessageQueue"("recipientId");

-- CreateIndex
CREATE INDEX "MessageQueue_whatsappAccountId_idx" ON "MessageQueue"("whatsappAccountId");

-- CreateIndex
CREATE INDEX "MessageQueue_status_idx" ON "MessageQueue"("status");

-- CreateIndex
CREATE INDEX "MessageQueue_priority_idx" ON "MessageQueue"("priority");

-- CreateIndex
CREATE INDEX "MessageQueue_scheduledAt_idx" ON "MessageQueue"("scheduledAt");

-- CreateIndex
CREATE INDEX "MessageQueue_createdAt_idx" ON "MessageQueue"("createdAt");

-- CreateIndex
CREATE INDEX "MessageLog_organizationId_idx" ON "MessageLog"("organizationId");

-- CreateIndex
CREATE INDEX "MessageLog_queueId_idx" ON "MessageLog"("queueId");

-- CreateIndex
CREATE INDEX "MessageLog_campaignId_idx" ON "MessageLog"("campaignId");

-- CreateIndex
CREATE INDEX "MessageLog_recipientId_idx" ON "MessageLog"("recipientId");

-- CreateIndex
CREATE INDEX "MessageLog_status_idx" ON "MessageLog"("status");

-- CreateIndex
CREATE INDEX "MessageLog_createdAt_idx" ON "MessageLog"("createdAt");

-- CreateIndex
CREATE INDEX "Pipeline_organizationId_idx" ON "Pipeline"("organizationId");

-- CreateIndex
CREATE INDEX "Pipeline_deletedAt_idx" ON "Pipeline"("deletedAt");

-- CreateIndex
CREATE INDEX "Pipeline_organizationId_active_deletedAt_idx" ON "Pipeline"("organizationId", "active", "deletedAt");

-- CreateIndex
CREATE INDEX "Pipeline_organizationId_isActive_idx" ON "Pipeline"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "PipelineStage_organizationId_idx" ON "PipelineStage"("organizationId");

-- CreateIndex
CREATE INDEX "PipelineStage_pipelineId_idx" ON "PipelineStage"("pipelineId");

-- CreateIndex
CREATE INDEX "PipelineStage_position_idx" ON "PipelineStage"("position");

-- CreateIndex
CREATE INDEX "PipelineStage_deletedAt_idx" ON "PipelineStage"("deletedAt");

-- CreateIndex
CREATE INDEX "PipelineStage_organizationId_pipelineId_position_idx" ON "PipelineStage"("organizationId", "pipelineId", "position");

-- CreateIndex
CREATE INDEX "PipelineStage_organizationId_pipelineId_isActive_idx" ON "PipelineStage"("organizationId", "pipelineId", "isActive");

-- CreateIndex
CREATE INDEX "PipelineLead_organizationId_idx" ON "PipelineLead"("organizationId");

-- CreateIndex
CREATE INDEX "PipelineLead_pipelineId_idx" ON "PipelineLead"("pipelineId");

-- CreateIndex
CREATE INDEX "PipelineLead_stageId_idx" ON "PipelineLead"("stageId");

-- CreateIndex
CREATE INDEX "PipelineLead_leadId_idx" ON "PipelineLead"("leadId");

-- CreateIndex
CREATE INDEX "PipelineLead_position_idx" ON "PipelineLead"("position");

-- CreateIndex
CREATE INDEX "PipelineLead_deletedAt_idx" ON "PipelineLead"("deletedAt");

-- CreateIndex
CREATE INDEX "PipelineLead_organizationId_pipelineId_stageId_position_idx" ON "PipelineLead"("organizationId", "pipelineId", "stageId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineLead_organizationId_pipelineId_leadId_key" ON "PipelineLead"("organizationId", "pipelineId", "leadId");

-- CreateIndex
CREATE INDEX "StageChecklist_organizationId_idx" ON "StageChecklist"("organizationId");

-- CreateIndex
CREATE INDEX "StageChecklist_organizationId_stageId_idx" ON "StageChecklist"("organizationId", "stageId");

-- CreateIndex
CREATE INDEX "StageChecklist_organizationId_stageId_position_idx" ON "StageChecklist"("organizationId", "stageId", "position");

-- CreateIndex
CREATE INDEX "StageChecklist_organizationId_stageId_isActive_idx" ON "StageChecklist"("organizationId", "stageId", "isActive");

-- CreateIndex
CREATE INDEX "PipelineLossReason_organizationId_idx" ON "PipelineLossReason"("organizationId");

-- CreateIndex
CREATE INDEX "PipelineLossReason_organizationId_pipelineId_idx" ON "PipelineLossReason"("organizationId", "pipelineId");

-- CreateIndex
CREATE INDEX "PipelineLossReason_organizationId_isActive_idx" ON "PipelineLossReason"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "Deal_organizationId_idx" ON "Deal"("organizationId");

-- CreateIndex
CREATE INDEX "Deal_organizationId_leadId_idx" ON "Deal"("organizationId", "leadId");

-- CreateIndex
CREATE INDEX "Deal_organizationId_pipelineId_idx" ON "Deal"("organizationId", "pipelineId");

-- CreateIndex
CREATE INDEX "Deal_organizationId_pipelineId_stageId_idx" ON "Deal"("organizationId", "pipelineId", "stageId");

-- CreateIndex
CREATE INDEX "Deal_organizationId_status_idx" ON "Deal"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Deal_organizationId_ownerId_idx" ON "Deal"("organizationId", "ownerId");

-- CreateIndex
CREATE INDEX "Deal_organizationId_expectedCloseDate_idx" ON "Deal"("organizationId", "expectedCloseDate");

-- CreateIndex
CREATE INDEX "Deal_organizationId_createdAt_idx" ON "Deal"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Deal_organizationId_closedAt_idx" ON "Deal"("organizationId", "closedAt");

-- CreateIndex
CREATE INDEX "Deal_organizationId_wonAt_idx" ON "Deal"("organizationId", "wonAt");

-- CreateIndex
CREATE INDEX "Deal_organizationId_lostAt_idx" ON "Deal"("organizationId", "lostAt");

-- CreateIndex
CREATE INDEX "Deal_organizationId_lossReasonId_idx" ON "Deal"("organizationId", "lossReasonId");

-- CreateIndex
CREATE INDEX "Deal_organizationId_pipelineId_stageId_status_idx" ON "Deal"("organizationId", "pipelineId", "stageId", "status");

-- CreateIndex
CREATE INDEX "DealStageMovement_organizationId_idx" ON "DealStageMovement"("organizationId");

-- CreateIndex
CREATE INDEX "DealStageMovement_organizationId_dealId_idx" ON "DealStageMovement"("organizationId", "dealId");

-- CreateIndex
CREATE INDEX "DealStageMovement_organizationId_pipelineId_idx" ON "DealStageMovement"("organizationId", "pipelineId");

-- CreateIndex
CREATE INDEX "DealStageMovement_organizationId_fromStageId_idx" ON "DealStageMovement"("organizationId", "fromStageId");

-- CreateIndex
CREATE INDEX "DealStageMovement_organizationId_toStageId_idx" ON "DealStageMovement"("organizationId", "toStageId");

-- CreateIndex
CREATE INDEX "DealStageMovement_organizationId_occurredAt_idx" ON "DealStageMovement"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "DealStageMovement_organizationId_pipelineId_toStageId_occur_idx" ON "DealStageMovement"("organizationId", "pipelineId", "toStageId", "occurredAt");

-- CreateIndex
CREATE INDEX "DealEvent_organizationId_idx" ON "DealEvent"("organizationId");

-- CreateIndex
CREATE INDEX "DealEvent_organizationId_dealId_idx" ON "DealEvent"("organizationId", "dealId");

-- CreateIndex
CREATE INDEX "DealEvent_organizationId_eventType_idx" ON "DealEvent"("organizationId", "eventType");

-- CreateIndex
CREATE INDEX "DealEvent_organizationId_occurredAt_idx" ON "DealEvent"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "DealEvent_organizationId_eventType_occurredAt_idx" ON "DealEvent"("organizationId", "eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "DealAssignment_organizationId_idx" ON "DealAssignment"("organizationId");

-- CreateIndex
CREATE INDEX "DealAssignment_organizationId_dealId_idx" ON "DealAssignment"("organizationId", "dealId");

-- CreateIndex
CREATE INDEX "DealAssignment_organizationId_fromUserId_idx" ON "DealAssignment"("organizationId", "fromUserId");

-- CreateIndex
CREATE INDEX "DealAssignment_organizationId_toUserId_idx" ON "DealAssignment"("organizationId", "toUserId");

-- CreateIndex
CREATE INDEX "DealAssignment_organizationId_assignedByUserId_idx" ON "DealAssignment"("organizationId", "assignedByUserId");

-- CreateIndex
CREATE INDEX "DealAssignment_organizationId_occurredAt_idx" ON "DealAssignment"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "Tag_organizationId_idx" ON "Tag"("organizationId");

-- CreateIndex
CREATE INDEX "Tag_organizationId_isActive_idx" ON "Tag"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_organizationId_slug_key" ON "Tag"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "DealTag_organizationId_idx" ON "DealTag"("organizationId");

-- CreateIndex
CREATE INDEX "DealTag_organizationId_dealId_idx" ON "DealTag"("organizationId", "dealId");

-- CreateIndex
CREATE INDEX "DealTag_organizationId_tagId_idx" ON "DealTag"("organizationId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "DealTag_dealId_tagId_key" ON "DealTag"("dealId", "tagId");

-- CreateIndex
CREATE INDEX "DealActivity_organizationId_idx" ON "DealActivity"("organizationId");

-- CreateIndex
CREATE INDEX "DealActivity_organizationId_dealId_idx" ON "DealActivity"("organizationId", "dealId");

-- CreateIndex
CREATE INDEX "DealActivity_organizationId_leadId_idx" ON "DealActivity"("organizationId", "leadId");

-- CreateIndex
CREATE INDEX "DealActivity_organizationId_assignedToUserId_idx" ON "DealActivity"("organizationId", "assignedToUserId");

-- CreateIndex
CREATE INDEX "DealActivity_organizationId_status_idx" ON "DealActivity"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DealActivity_organizationId_dueAt_idx" ON "DealActivity"("organizationId", "dueAt");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_module_idx" ON "AuditLog"("module");

-- CreateIndex
CREATE INDEX "AuditLog_module_entityType_idx" ON "AuditLog"("module", "entityType");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_module_idx" ON "AuditLog"("organizationId", "module");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_module_entityType_idx" ON "AuditLog"("organizationId", "module", "entityType");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_occurredAt_idx" ON "AuditLog"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuthSession_userId_revokedAt_expiresAt_idx" ON "AuthSession"("userId", "revokedAt", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_status_expiresAt_idx" ON "RefreshToken"("userId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "RefreshToken_sessionId_status_idx" ON "RefreshToken"("sessionId", "status");

-- CreateIndex
CREATE INDEX "AuthAuditLog_userId_createdAt_idx" ON "AuthAuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuthAuditLog_organizationId_createdAt_idx" ON "AuthAuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuthAuditLog_eventType_createdAt_idx" ON "AuthAuditLog"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "DistributionList_organizationId_status_idx" ON "DistributionList"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DistributionList_organizationId_name_idx" ON "DistributionList"("organizationId", "name");

-- CreateIndex
CREATE INDEX "DistributionList_deletedAt_idx" ON "DistributionList"("deletedAt");

-- CreateIndex
CREATE INDEX "DistributionMember_organizationId_distributionListId_isActi_idx" ON "DistributionMember"("organizationId", "distributionListId", "isActive", "position");

-- CreateIndex
CREATE INDEX "DistributionMember_organizationId_phoneE164_idx" ON "DistributionMember"("organizationId", "phoneE164");

-- CreateIndex
CREATE INDEX "DistributionMember_deletedAt_idx" ON "DistributionMember"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DistributionMember_distributionListId_phoneE164_key" ON "DistributionMember"("distributionListId", "phoneE164");

-- CreateIndex
CREATE UNIQUE INDEX "DistributionMember_distributionListId_position_key" ON "DistributionMember"("distributionListId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "DistributionCursor_distributionListId_key" ON "DistributionCursor"("distributionListId");

-- CreateIndex
CREATE INDEX "DistributionCursor_lastMemberId_idx" ON "DistributionCursor"("lastMemberId");

-- CreateIndex
CREATE INDEX "LeadDistribution_organizationId_campaignId_createdAt_idx" ON "LeadDistribution"("organizationId", "campaignId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadDistribution_organizationId_distributionListId_createdA_idx" ON "LeadDistribution"("organizationId", "distributionListId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadDistribution_organizationId_distributionMemberId_create_idx" ON "LeadDistribution"("organizationId", "distributionMemberId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadDistribution_organizationId_recipientPhoneE164_idx" ON "LeadDistribution"("organizationId", "recipientPhoneE164");

-- CreateIndex
CREATE INDEX "LeadDistribution_organizationId_status_createdAt_idx" ON "LeadDistribution"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LeadDistribution_organizationId_idempotencyKey_key" ON "LeadDistribution"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "analytics_events_organizationId_source_eventType_occurredAt_idx" ON "analytics_events"("organizationId", "source", "eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "analytics_events_organizationId_processedAt_occurredAt_idx" ON "analytics_events"("organizationId", "processedAt", "occurredAt");

-- CreateIndex
CREATE INDEX "analytics_events_organizationId_distributionId_occurredAt_idx" ON "analytics_events"("organizationId", "distributionId", "occurredAt");

-- CreateIndex
CREATE INDEX "analytics_events_organizationId_dealId_occurredAt_idx" ON "analytics_events"("organizationId", "dealId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_events_organizationId_idempotencyKey_key" ON "analytics_events"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "daily_metrics_organizationId_bucketStart_idx" ON "daily_metrics"("organizationId", "bucketStart");

-- CreateIndex
CREATE UNIQUE INDEX "daily_metrics_organizationId_bucketStart_key" ON "daily_metrics"("organizationId", "bucketStart");

-- CreateIndex
CREATE INDEX "hourly_metrics_organizationId_bucketStart_idx" ON "hourly_metrics"("organizationId", "bucketStart");

-- CreateIndex
CREATE UNIQUE INDEX "hourly_metrics_organizationId_bucketStart_key" ON "hourly_metrics"("organizationId", "bucketStart");

-- CreateIndex
CREATE INDEX "campaign_metrics_organizationId_bucketStart_idx" ON "campaign_metrics"("organizationId", "bucketStart");

-- CreateIndex
CREATE INDEX "campaign_metrics_organizationId_campaignId_bucketStart_idx" ON "campaign_metrics"("organizationId", "campaignId", "bucketStart");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_metrics_organizationId_campaignId_bucketStart_key" ON "campaign_metrics"("organizationId", "campaignId", "bucketStart");

-- CreateIndex
CREATE INDEX "broker_metrics_organizationId_bucketStart_idx" ON "broker_metrics"("organizationId", "bucketStart");

-- CreateIndex
CREATE INDEX "broker_metrics_organizationId_brokerUserId_bucketStart_idx" ON "broker_metrics"("organizationId", "brokerUserId", "bucketStart");

-- CreateIndex
CREATE UNIQUE INDEX "broker_metrics_organizationId_brokerUserId_bucketStart_key" ON "broker_metrics"("organizationId", "brokerUserId", "bucketStart");

-- CreateIndex
CREATE INDEX "manager_metrics_organizationId_bucketStart_idx" ON "manager_metrics"("organizationId", "bucketStart");

-- CreateIndex
CREATE INDEX "manager_metrics_organizationId_managerUserId_bucketStart_idx" ON "manager_metrics"("organizationId", "managerUserId", "bucketStart");

-- CreateIndex
CREATE UNIQUE INDEX "manager_metrics_organizationId_managerUserId_bucketStart_key" ON "manager_metrics"("organizationId", "managerUserId", "bucketStart");

-- CreateIndex
CREATE INDEX "whatsapp_metrics_organizationId_bucketStart_idx" ON "whatsapp_metrics"("organizationId", "bucketStart");

-- CreateIndex
CREATE INDEX "whatsapp_metrics_organizationId_whatsappAccountId_bucketSta_idx" ON "whatsapp_metrics"("organizationId", "whatsappAccountId", "bucketStart");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_metrics_organizationId_whatsappAccountId_bucketSta_key" ON "whatsapp_metrics"("organizationId", "whatsappAccountId", "bucketStart");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chatwoot" ADD CONSTRAINT "Chatwoot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dify" ADD CONSTRAINT "Dify_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DifySetting" ADD CONSTRAINT "DifySetting_difyIdFallback_fkey" FOREIGN KEY ("difyIdFallback") REFERENCES "Dify"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DifySetting" ADD CONSTRAINT "DifySetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evoai" ADD CONSTRAINT "Evoai_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvoaiSetting" ADD CONSTRAINT "EvoaiSetting_evoaiIdFallback_fkey" FOREIGN KEY ("evoaiIdFallback") REFERENCES "Evoai"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvoaiSetting" ADD CONSTRAINT "EvoaiSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvolutionBot" ADD CONSTRAINT "EvolutionBot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvolutionBotSetting" ADD CONSTRAINT "EvolutionBotSetting_botIdFallback_fkey" FOREIGN KEY ("botIdFallback") REFERENCES "EvolutionBot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvolutionBotSetting" ADD CONSTRAINT "EvolutionBotSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flowise" ADD CONSTRAINT "Flowise_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowiseSetting" ADD CONSTRAINT "FlowiseSetting_flowiseIdFallback_fkey" FOREIGN KEY ("flowiseIdFallback") REFERENCES "Flowise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowiseSetting" ADD CONSTRAINT "FlowiseSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSession" ADD CONSTRAINT "IntegrationSession_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kafka" ADD CONSTRAINT "Kafka_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Label" ADD CONSTRAINT "Label_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "IntegrationSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageUpdate" ADD CONSTRAINT "MessageUpdate_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageUpdate" ADD CONSTRAINT "MessageUpdate_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "N8n" ADD CONSTRAINT "N8n_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "N8nSetting" ADD CONSTRAINT "N8nSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "N8nSetting" ADD CONSTRAINT "N8nSetting_n8nIdFallback_fkey" FOREIGN KEY ("n8nIdFallback") REFERENCES "N8n"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nats" ADD CONSTRAINT "Nats_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenaiBot" ADD CONSTRAINT "OpenaiBot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenaiBot" ADD CONSTRAINT "OpenaiBot_openaiCredsId_fkey" FOREIGN KEY ("openaiCredsId") REFERENCES "OpenaiCreds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenaiCreds" ADD CONSTRAINT "OpenaiCreds_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenaiSetting" ADD CONSTRAINT "OpenaiSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenaiSetting" ADD CONSTRAINT "OpenaiSetting_openaiCredsId_fkey" FOREIGN KEY ("openaiCredsId") REFERENCES "OpenaiCreds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenaiSetting" ADD CONSTRAINT "OpenaiSetting_openaiIdFallback_fkey" FOREIGN KEY ("openaiIdFallback") REFERENCES "OpenaiBot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proxy" ADD CONSTRAINT "Proxy_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pusher" ADD CONSTRAINT "Pusher_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rabbitmq" ADD CONSTRAINT "Rabbitmq_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sqs" ADD CONSTRAINT "Sqs_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Typebot" ADD CONSTRAINT "Typebot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypebotSetting" ADD CONSTRAINT "TypebotSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypebotSetting" ADD CONSTRAINT "TypebotSetting_typebotIdFallback_fkey" FOREIGN KEY ("typebotIdFallback") REFERENCES "Typebot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Websocket" ADD CONSTRAINT "Websocket_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RbacRole" ADD CONSTRAINT "RbacRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "RbacRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "RbacRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappAccount" ADD CONSTRAINT "WhatsappAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappAccount" ADD CONSTRAINT "WhatsappAccount_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappTemplate" ADD CONSTRAINT "WhatsappTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappTemplate" ADD CONSTRAINT "WhatsappTemplate_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "WhatsappAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappConversation" ADD CONSTRAINT "WhatsappConversation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappConversation" ADD CONSTRAINT "WhatsappConversation_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "WhatsappAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappConversation" ADD CONSTRAINT "WhatsappConversation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappConversation" ADD CONSTRAINT "WhatsappConversation_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappConversation" ADD CONSTRAINT "WhatsappConversation_managerUserId_fkey" FOREIGN KEY ("managerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappMessage" ADD CONSTRAINT "WhatsappMessage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappMessage" ADD CONSTRAINT "WhatsappMessage_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "WhatsappAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappMessage" ADD CONSTRAINT "WhatsappMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsappConversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappMessage" ADD CONSTRAINT "WhatsappMessage_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappMessage" ADD CONSTRAINT "WhatsappMessage_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappWebhookEvent" ADD CONSTRAINT "WhatsappWebhookEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappWebhookEvent" ADD CONSTRAINT "WhatsappWebhookEvent_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "WhatsappAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_managerUserId_fkey" FOREIGN KEY ("managerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadExternalIdentity" ADD CONSTRAINT "LeadExternalIdentity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEvent" ADD CONSTRAINT "LeadEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEvent" ADD CONSTRAINT "LeadEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadHistory" ADD CONSTRAINT "LeadHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadHistory" ADD CONSTRAINT "LeadHistory_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "WhatsappAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_whatsappTemplateId_fkey" FOREIGN KEY ("whatsappTemplateId") REFERENCES "WhatsappTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignFilter" ADD CONSTRAINT "CampaignFilter_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageQueue" ADD CONSTRAINT "MessageQueue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageQueue" ADD CONSTRAINT "MessageQueue_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageQueue" ADD CONSTRAINT "MessageQueue_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "CampaignRecipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageQueue" ADD CONSTRAINT "MessageQueue_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "WhatsappAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "MessageQueue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "CampaignRecipient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pipeline" ADD CONSTRAINT "Pipeline_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pipeline" ADD CONSTRAINT "Pipeline_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineLead" ADD CONSTRAINT "PipelineLead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineLead" ADD CONSTRAINT "PipelineLead_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineLead" ADD CONSTRAINT "PipelineLead_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineLead" ADD CONSTRAINT "PipelineLead_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageChecklist" ADD CONSTRAINT "StageChecklist_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageChecklist" ADD CONSTRAINT "StageChecklist_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineLossReason" ADD CONSTRAINT "PipelineLossReason_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineLossReason" ADD CONSTRAINT "PipelineLossReason_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_lossReasonId_fkey" FOREIGN KEY ("lossReasonId") REFERENCES "PipelineLossReason"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealStageMovement" ADD CONSTRAINT "DealStageMovement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealStageMovement" ADD CONSTRAINT "DealStageMovement_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealStageMovement" ADD CONSTRAINT "DealStageMovement_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "PipelineStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealStageMovement" ADD CONSTRAINT "DealStageMovement_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "PipelineStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealStageMovement" ADD CONSTRAINT "DealStageMovement_movedByUserId_fkey" FOREIGN KEY ("movedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealEvent" ADD CONSTRAINT "DealEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealEvent" ADD CONSTRAINT "DealEvent_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealEvent" ADD CONSTRAINT "DealEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealAssignment" ADD CONSTRAINT "DealAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealAssignment" ADD CONSTRAINT "DealAssignment_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealAssignment" ADD CONSTRAINT "DealAssignment_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealAssignment" ADD CONSTRAINT "DealAssignment_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealAssignment" ADD CONSTRAINT "DealAssignment_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealTag" ADD CONSTRAINT "DealTag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealTag" ADD CONSTRAINT "DealTag_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealTag" ADD CONSTRAINT "DealTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealTag" ADD CONSTRAINT "DealTag_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealActivity" ADD CONSTRAINT "DealActivity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealActivity" ADD CONSTRAINT "DealActivity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealActivity" ADD CONSTRAINT "DealActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealActivity" ADD CONSTRAINT "DealActivity_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealActivity" ADD CONSTRAINT "DealActivity_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AuthSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthAuditLog" ADD CONSTRAINT "AuthAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionList" ADD CONSTRAINT "DistributionList_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionList" ADD CONSTRAINT "DistributionList_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionMember" ADD CONSTRAINT "DistributionMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionMember" ADD CONSTRAINT "DistributionMember_distributionListId_fkey" FOREIGN KEY ("distributionListId") REFERENCES "DistributionList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionCursor" ADD CONSTRAINT "DistributionCursor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionCursor" ADD CONSTRAINT "DistributionCursor_distributionListId_fkey" FOREIGN KEY ("distributionListId") REFERENCES "DistributionList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionCursor" ADD CONSTRAINT "DistributionCursor_lastMemberId_fkey" FOREIGN KEY ("lastMemberId") REFERENCES "DistributionMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDistribution" ADD CONSTRAINT "LeadDistribution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDistribution" ADD CONSTRAINT "LeadDistribution_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDistribution" ADD CONSTRAINT "LeadDistribution_distributionListId_fkey" FOREIGN KEY ("distributionListId") REFERENCES "DistributionList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDistribution" ADD CONSTRAINT "LeadDistribution_distributionMemberId_fkey" FOREIGN KEY ("distributionMemberId") REFERENCES "DistributionMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDistribution" ADD CONSTRAINT "LeadDistribution_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_metrics" ADD CONSTRAINT "daily_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hourly_metrics" ADD CONSTRAINT "hourly_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_metrics" ADD CONSTRAINT "campaign_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_metrics" ADD CONSTRAINT "broker_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_metrics" ADD CONSTRAINT "manager_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_metrics" ADD CONSTRAINT "whatsapp_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
