import { LeadActivityPriority, LeadActivityStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { activityTypes, activityVisibilities } from './lead-timeline.dto';

export class CreateLeadActivityDto {
  @IsString() @MaxLength(255) title: string;
  @IsDateString() dueAt: string;
  @IsOptional() @IsEnum(LeadActivityStatus) status?: LeadActivityStatus;
  @IsOptional() @IsEnum(LeadActivityPriority) priority?: LeadActivityPriority;
  @IsOptional() @IsString() @MaxLength(4000) note?: string | null;
  @IsString() responsibleUserId: string;
  @IsOptional() @IsIn(activityTypes) type?: typeof activityTypes[number];
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsOptional() @IsString() @MaxLength(500) result?: string;
  @IsOptional() @IsIn(activityVisibilities) visibility?: typeof activityVisibilities[number];
  @IsOptional() @IsDateString() nextFollowUpAt?: string;
  @IsOptional() @IsInt() @Min(0) @Max(525600) reminderMinutes?: number;
}
