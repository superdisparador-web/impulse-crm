import { IsOptional, IsString } from 'class-validator';

export class ListWhatsappDto {
  @IsOptional()
  @IsString()
  organizationId?: string;
}
