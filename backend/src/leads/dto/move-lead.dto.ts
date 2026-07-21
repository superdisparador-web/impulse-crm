import { IsNotEmpty, IsString } from 'class-validator';

export class MoveLeadDto {
  @IsNotEmpty() @IsString() stageId: string;
}
