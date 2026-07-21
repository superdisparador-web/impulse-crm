import { LeadActivityPriority, LeadActivityStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateLeadActivityDto {
  @IsString() title: string;
  @IsDateString() dueAt: string;
  @IsOptional() @IsEnum(LeadActivityStatus) status?: LeadActivityStatus;
  @IsOptional() @IsEnum(LeadActivityPriority) priority?: LeadActivityPriority;
  @IsOptional() @IsString() note?: string | null;
  @IsString() responsibleUserId: string;
}
