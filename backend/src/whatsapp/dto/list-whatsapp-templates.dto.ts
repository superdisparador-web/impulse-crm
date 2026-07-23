import { IsBooleanString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { whatsappTemplateCategories, whatsappTemplateLanguages, whatsappTemplateStatuses } from './create-whatsapp-template.dto';

export class ListWhatsappTemplatesDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsIn(whatsappTemplateStatuses) status?: string;
  @IsOptional() @IsIn(whatsappTemplateCategories) category?: string;
  @IsOptional() @IsIn(whatsappTemplateLanguages) language?: string;
  @IsOptional() @IsBooleanString() archived?: string;
  @IsOptional() @IsIn(['active', 'inactive', 'archived', 'all']) state?: 'active' | 'inactive' | 'archived' | 'all';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number = 20;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
}
