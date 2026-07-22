import { LeadSource, LeadStatus, LeadTemperature } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEmail, IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

export class LeadExternalIdentityDto {
  @IsString()
  provider: string;

  @IsString()
  externalId: string;

  @IsOptional()
  @IsString()
  externalAccountId?: string | null;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreateLeadDto {
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
  @IsOptional() @ValidateNested() @Type(() => LeadExternalIdentityDto) externalIdentity?: LeadExternalIdentityDto;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LeadExternalIdentityDto) externalIdentities?: LeadExternalIdentityDto[];
}
