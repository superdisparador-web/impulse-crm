import { IsDateString, IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export const ANALYTICS_EVENT_SOURCES = ['leads', 'campaigns', 'distribution', 'whatsapp'] as const;
export type AnalyticsEventSource = typeof ANALYTICS_EVENT_SOURCES[number];

export class RecordAnalyticsEventDto {
  @IsString() organizationId!: string;
  @IsIn(ANALYTICS_EVENT_SOURCES) source!: AnalyticsEventSource;
  @IsString() eventType!: string;
  @IsOptional() @IsString() leadId?: string;
  @IsOptional() @IsString() campaignId?: string;
  @IsOptional() @IsString() brokerUserId?: string;
  @IsOptional() @IsString() managerUserId?: string;
  @IsOptional() @IsString() whatsappAccountId?: string;
  @IsOptional() @IsString() idempotencyKey?: string;
  @IsOptional() @IsDateString() occurredAt?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}
