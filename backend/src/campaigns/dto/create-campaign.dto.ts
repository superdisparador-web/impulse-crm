import { CampaignType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString, MinLength, ValidateNested, IsArray } from 'class-validator';
import { CampaignFilterDto } from './campaign-filter.dto';

export class CreateCampaignDto {
  @IsString() @MinLength(1) name: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(CampaignType) campaignType: CampaignType;
  @IsOptional() @IsDateString() scheduledAt?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CampaignFilterDto) filters?: CampaignFilterDto[];
}
