import { LeadActivityPriority, LeadActivityStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLeadActivityDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsDateString() dueAt?: string;
  @IsOptional() @IsEnum(LeadActivityStatus) status?: LeadActivityStatus;
  @IsOptional() @IsEnum(LeadActivityPriority) priority?: LeadActivityPriority;
  @IsOptional() @IsString() note?: string | null;
  @IsOptional() @IsDateString() completedAt?: string | null;
  @IsOptional() @IsString() responsibleUserId?: string;
  @IsOptional() @IsString() @MaxLength(500) result?: string;
  @IsOptional() @IsDateString() nextFollowUpAt?: string | null;
}
