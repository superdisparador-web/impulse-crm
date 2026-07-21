import { LeadSource, LeadStatus, LeadTemperature } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateLeadDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string | null;
  @IsOptional() @IsString() document?: string | null;
  @IsOptional() @IsEnum(LeadSource) source?: LeadSource;
  @IsOptional() @IsEnum(LeadStatus) status?: LeadStatus;
  @IsOptional() @IsEnum(LeadTemperature) temperature?: LeadTemperature;
  @IsOptional() @IsString() notes?: string | null;
  @IsOptional() @IsString() assignedUserId?: string | null;
  @IsOptional() @IsString() pipelineId?: string | null;
  @IsOptional() @IsString() stageId?: string | null;
}
