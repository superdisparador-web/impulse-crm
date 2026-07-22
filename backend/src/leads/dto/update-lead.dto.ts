import { LeadSource, LeadStatus, LeadTemperature } from '@prisma/client';
import { IsDateString, IsEmail, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateLeadDto {
  @IsOptional() @IsString() name?: string | null;
  @IsOptional() @IsString() phone?: string | null;
  @IsOptional() @IsEmail() email?: string | null;
  @IsOptional() @IsString() document?: string | null;
  @IsOptional() @IsEnum(LeadSource) source?: LeadSource;
  @IsOptional() @IsEnum(LeadStatus) status?: LeadStatus;
  @IsOptional() @IsEnum(LeadTemperature) temperature?: LeadTemperature;
  @IsOptional() @IsString() notes?: string | null;
  @IsOptional() @IsString() assignedUserId?: string | null;
  @IsOptional() @IsString() managerUserId?: string | null;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
  @IsOptional() @IsDateString() lastContactAt?: string | null;
}
