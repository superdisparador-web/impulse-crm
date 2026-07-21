import { LeadSource, LeadStatus, LeadTemperature } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListLeadsDto {
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) page?: number;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) @Max(100) limit?: number;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(LeadStatus) status?: LeadStatus;
  @IsOptional() @IsEnum(LeadTemperature) temperature?: LeadTemperature;
  @IsOptional() @IsEnum(LeadSource) source?: LeadSource;
  @IsOptional() @IsString() organizationId?: string;
  @IsOptional() @IsString() assignedUserId?: string;
  @IsOptional() @IsString() pipelineId?: string;
  @IsOptional() @IsString() stageId?: string;
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean() assigned?: boolean;
  @IsOptional() @IsDateString() createdFrom?: string;
  @IsOptional() @IsDateString() createdTo?: string;
  @IsOptional() @IsIn(['asc', 'desc']) order?: 'asc' | 'desc';
}
