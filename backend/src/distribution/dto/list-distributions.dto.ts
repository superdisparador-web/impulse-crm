import { DistributionStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListDistributionsDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number = 20;
  @IsOptional() @IsString() campaignId?: string;
  @IsOptional() @IsString() distributionListId?: string;
  @IsOptional() @IsString() distributionMemberId?: string;
  @IsOptional() @IsString() recipientPhoneE164?: string;
  @IsOptional() @IsEnum(DistributionStatus) status?: DistributionStatus;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}
