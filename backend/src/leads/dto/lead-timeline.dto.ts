import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const activityTypes = ['CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'VISIT', 'NOTE', 'FOLLOW_UP', 'OTHER'] as const;
export const activityVisibilities = ['TEAM', 'PRIVATE'] as const;

export class LeadTimelineQueryDto {
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) @Max(100) limit?: number;
  @IsOptional() @IsIn(['asc', 'desc']) order?: 'asc' | 'desc';
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @IsString() @MaxLength(120) search?: string;
  @IsOptional() @Transform(({ value }) => value === true || value === 'true') @IsBoolean() notesOnly?: boolean;
  @IsOptional() @Transform(({ value }) => value === true || value === 'true') @IsBoolean() stagesOnly?: boolean;
  @IsOptional() @Transform(({ value }) => value === true || value === 'true') @IsBoolean() activitiesOnly?: boolean;
  @IsOptional() @IsIn(['ALL', 'AUTOMATIC', 'MANUAL']) mode?: 'ALL' | 'AUTOMATIC' | 'MANUAL';
}

export class CreateCommercialActivityDto {
  @IsIn(activityTypes) type: typeof activityTypes[number];
  @IsString() @MaxLength(255) title: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsDateString() dueAt: string;
  @IsOptional() @IsString() @MaxLength(500) result?: string;
  @IsOptional() @IsDateString() nextFollowUpAt?: string;
  @IsIn(activityVisibilities) visibility: typeof activityVisibilities[number];
  @IsString() responsibleUserId: string;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(0) @Max(525600) reminderMinutes?: number;
}

export class UpdateCommercialActivityDto {
  @IsOptional() @IsIn(['COMPLETED', 'CANCELED']) status?: 'COMPLETED' | 'CANCELED';
  @IsOptional() @IsString() @MaxLength(500) result?: string;
  @IsOptional() @IsDateString() completedAt?: string;
}
