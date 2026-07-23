import { DistributionListStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateDistributionListDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string | null;
  @IsOptional() @IsEnum(DistributionListStatus) status?: DistributionListStatus;
}

export class UpdateDistributionListDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string | null;
  @IsOptional() @IsEnum(DistributionListStatus) status?: DistributionListStatus;
}
