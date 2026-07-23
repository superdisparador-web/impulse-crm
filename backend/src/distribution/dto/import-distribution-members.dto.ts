import { DistributionImportMode } from '@prisma/client';
import { IsBase64, IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class ImportDistributionMembersDto {
  @IsString() fileName: string;
  @IsBase64() contentBase64: string;
  @IsOptional() @IsEnum(DistributionImportMode) mode?: DistributionImportMode;
  @IsOptional() @IsObject() columnMapping?: { name?: string; phone?: string };
  @IsOptional() @IsBoolean() previewOnly?: boolean;
}
