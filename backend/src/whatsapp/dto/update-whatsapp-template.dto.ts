import { IsArray, IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { whatsappTemplateCategories, whatsappTemplateHeaderTypes, whatsappTemplateLanguages, whatsappTemplateStatuses } from './create-whatsapp-template.dto';

export class UpdateWhatsappTemplateDto {
  @IsOptional() @IsString() whatsappAccountId?: string | null;
  @IsOptional() @IsString() @MaxLength(255) name?: string;
  @IsOptional() @IsString() @MaxLength(255) displayName?: string;
  @IsOptional() @IsString() @MaxLength(255) metaName?: string;
  @IsOptional() @IsIn(whatsappTemplateLanguages) language?: 'pt_BR' | 'en_US' | 'es_ES';
  @IsOptional() @IsIn(whatsappTemplateCategories) category?: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  @IsOptional() @IsIn(whatsappTemplateStatuses) status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED';
  @IsOptional() @IsIn(whatsappTemplateHeaderTypes) headerType?: 'NONE' | 'TEXT';
  @IsOptional() @IsString() @MaxLength(255) headerText?: string | null;
  @IsOptional() @IsString() @MaxLength(4096) body?: string;
  @IsOptional() @IsString() @MaxLength(255) footer?: string | null;
  @IsOptional() @IsArray() buttons?: unknown[];
  @IsOptional() @IsString() @MaxLength(128) metaTemplateId?: string | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
