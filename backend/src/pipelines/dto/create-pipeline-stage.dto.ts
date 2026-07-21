import { IsBoolean, IsHexColor, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreatePipelineStageDto {
  @IsNotEmpty() @IsString() name: string;
  @IsNotEmpty() @IsString() pipelineId: string;
  @IsOptional() @IsInt() @Min(0) order?: number;
  @IsOptional() @IsHexColor() color?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}
