import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export const saoPauloRegions = ['NORTE', 'SUL', 'LESTE', 'OESTE', 'CENTRO'] as const;

export class CampaignSegmentationDto {
  @IsOptional() @IsIn(saoPauloRegions) region?: (typeof saoPauloRegions)[number];
  @IsOptional() @IsString() neighborhood?: string;
  @IsOptional() @IsString() development?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minIncome?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxIncome?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(20) bedrooms?: number;
  @IsOptional() @Transform(({ value }) => value === true || value === 'true') @IsBoolean() hasParking?: boolean;
  @IsOptional() @Transform(({ value }) => value === true || value === 'true') @IsBoolean() hasBalcony?: boolean;
  @IsOptional() @Transform(({ value }) => value === true || value === 'true') @IsBoolean() mcmv?: boolean;
  @IsOptional() @IsString() managerId?: string;
  @IsOptional() @IsString() brokerId?: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() temperature?: string;
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
}

export class CampaignAudienceEstimateDto extends CampaignSegmentationDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000) speed?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) concurrency?: number;
  @IsOptional() @IsIn(['MARKETING', 'UTILITY', 'AUTHENTICATION']) category?: 'MARKETING'|'UTILITY'|'AUTHENTICATION';
}
