import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsIn, IsInt, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Priority } from '@prisma/client';

export class CreateMessageQueueRecipientDto {
  @IsOptional() @IsString() recipientId?: string;
  @IsOptional() @IsString() whatsappAccountId?: string;
  @IsOptional() @IsDateString() scheduledAt?: string;
  @IsOptional() @IsIn(Object.values(Priority)) priority?: Priority;
  @IsOptional() @IsInt() @Min(1) maxAttempts?: number;
  @IsOptional() @IsObject() payload?: Record<string, unknown>;
}

export class CreateMessageQueueDto {
  @IsString() campaignId!: string;
  @IsOptional() @IsString() whatsappAccountId?: string;
  @IsOptional() @IsDateString() scheduledAt?: string;
  @IsOptional() @IsIn(Object.values(Priority)) priority?: Priority;
  @IsOptional() @IsInt() @Min(1) maxAttempts?: number;
  @IsOptional() @IsObject() payload?: Record<string, unknown>;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateMessageQueueRecipientDto) recipients?: CreateMessageQueueRecipientDto[];
}
