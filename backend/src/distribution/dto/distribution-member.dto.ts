import { IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDistributionMemberDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;
}

export class UpdateDistributionMemberDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;
}

export class ReorderDistributionListsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderDistributionMemberDto)
  members: ReorderDistributionMemberDto[];
}

export class ReorderDistributionMemberDto {
  @IsString()
  id: string;

  @IsInt()
  @Min(1)
  position: number;
}
