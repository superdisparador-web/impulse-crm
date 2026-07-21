import { LeadSource, LeadStatus, LeadTemperature } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class AddRecipientsDto {
  @IsOptional() @IsArray() @IsString({ each: true }) leadIds?: string[];
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(LeadStatus) status?: LeadStatus;
  @IsOptional() @IsEnum(LeadSource) source?: LeadSource;
  @IsOptional() @IsString() assignedUserId?: string;
  @IsOptional() @IsEnum(LeadTemperature) temperature?: LeadTemperature;
}
