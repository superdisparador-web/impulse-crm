import { IsBoolean, IsHexColor, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdatePipelineStageDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() pipelineId?: string;
  @IsOptional() @IsInt() @Min(0) order?: number;
  @IsOptional() @IsHexColor() color?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}
