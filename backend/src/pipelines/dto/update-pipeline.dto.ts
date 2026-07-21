import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePipelineDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}
