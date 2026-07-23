import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AnalyticsQueryDto {
  @IsOptional() @IsString() organizationId?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) @Max(500) limit?: number;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) page?: number;
}

export class EntityMetricsQueryDto extends AnalyticsQueryDto {
  @IsOptional() @IsString() campaignId?: string;
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() whatsappAccountId?: string;
  @IsOptional() @IsIn(['asc', 'desc']) order?: 'asc' | 'desc';
}
