import { CampaignStatus, CampaignType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { CampaignFilterDto } from './campaign-filter.dto';

export class UpdateCampaignDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @IsString() description?: string | null;
  @IsOptional() @IsEnum(CampaignType) campaignType?: CampaignType;
  @IsOptional() @IsEnum(CampaignStatus) status?: CampaignStatus;
  @IsOptional() @IsDateString() scheduledAt?: string | null;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CampaignFilterDto) filters?: CampaignFilterDto[];
}
