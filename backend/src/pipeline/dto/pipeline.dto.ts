import { Type } from 'class-transformer';
import { LeadSource, LeadStatus, LeadTemperature } from '@prisma/client';
import { ArrayNotEmpty, IsArray, IsBoolean, IsDateString, IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export class ListPipelinesDto {
  @IsOptional() @IsString() organizationId?: string;
}

export class CreatePipelineDto {
  @IsString() @MaxLength(120) name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() organizationId?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdatePipelineDto {
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateStageDto {
  @IsString() @MaxLength(120) name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) position?: number;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateStageDto {
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ReorderStageItemDto {
  @IsString() id: string;
  @Type(() => Number) @IsInt() @Min(0) position: number;
}

export class ReorderStagesDto {
  @IsArray() @ArrayNotEmpty() @ValidateNested({ each: true }) @Type(() => ReorderStageItemDto) stages: ReorderStageItemDto[];
}

export class AddCardDto {
  @IsString() leadId: string;
  @IsString() stageId: string;
}

export class MoveCardDto {
  @IsString() stageId: string;
  @Type(() => Number) @IsInt() @Min(0) position: number;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

export class PipelineBoardQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() brokerId?: string;
  @IsOptional() @IsString() managerId?: string;
  @IsOptional() @IsString() development?: string;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsString() neighborhood?: string;
  @IsOptional() @IsEnum(LeadStatus) status?: LeadStatus;
  @IsOptional() @IsEnum(LeadTemperature) temperature?: LeadTemperature;
  @IsOptional() @IsEnum(LeadSource) source?: LeadSource;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @IsIn(['ALL', 'OVERDUE', 'ON_TIME']) sla?: 'ALL' | 'OVERDUE' | 'ON_TIME';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}
