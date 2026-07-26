import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class ReportQueryDto {
  @IsOptional() @IsString() organizationId?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @IsString() campaignId?: string;
  @IsOptional() @IsString() brokerId?: string;
  @IsOptional() @IsString() managerId?: string;
  @IsOptional() @IsString() templateId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsString() product?: string;
  @IsOptional() @IsString() development?: string;
  @IsOptional() @IsIn(['campaigns', 'events', 'conversions']) dataset: 'campaigns' | 'events' | 'conversions' = 'campaigns';
}
