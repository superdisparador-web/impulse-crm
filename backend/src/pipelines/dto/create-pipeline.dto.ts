import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePipelineDto {
  @IsNotEmpty() @IsString() name: string;
  @IsOptional() @IsBoolean() active?: boolean;
}
