import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ListPipelineStagesDto {
  @IsOptional() @IsString() pipelineId?: string;
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean() active?: boolean;
}
