import { DistributionStrategy, DistributionTriggerType } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class AssignBrokerCommandDto {
  @IsString() organizationId: string;
  @IsOptional() @IsString() campaignId?: string;
  @IsString() distributionListId: string;
  @IsOptional() @IsString() leadId?: string;
  @IsString() recipientPhoneE164: string;
  @IsOptional() @IsEnum(DistributionTriggerType) triggerType?: DistributionTriggerType;
  @IsOptional() @IsString() triggerButtonId?: string;
  @IsOptional() @IsString() webhookEventId?: string;
  @IsString() idempotencyKey: string;
  @IsOptional() @IsEnum(DistributionStrategy) strategy?: DistributionStrategy;
  @IsOptional() @IsString() autoMessage?: string;
  @IsOptional() @IsBoolean() sendWaMeLink?: boolean;
  @IsOptional() @IsString() waMeInitialMessage?: string;
}
