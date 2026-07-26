import { IsArray, IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export const whatsappTemplateCategories = ['MARKETING', 'UTILITY', 'AUTHENTICATION'] as const;
export const whatsappTemplateStatuses = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'DISABLED', 'PAUSED', 'IN_APPEAL', 'PENDING_DELETION', 'DELETED', 'LIMIT_EXCEEDED', 'UNKNOWN'] as const;
export const whatsappTemplateLanguages = ['pt_BR', 'en_US', 'es_ES'] as const;
export const whatsappTemplateHeaderTypes = ['NONE', 'TEXT'] as const;

export class CreateWhatsappTemplateDto {
  @IsOptional() @IsString() whatsappAccountId?: string;
  @IsNotEmpty() @IsString() @MaxLength(255) name: string;
  @IsNotEmpty() @IsString() @MaxLength(255) displayName: string;
  @IsNotEmpty() @IsString() @MaxLength(255) metaName: string;
  @IsIn(whatsappTemplateLanguages) language: 'pt_BR' | 'en_US' | 'es_ES';
  @IsIn(whatsappTemplateCategories) category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  @IsOptional() @IsIn(whatsappTemplateStatuses) status?: typeof whatsappTemplateStatuses[number];
  @IsOptional() @IsIn(whatsappTemplateHeaderTypes) headerType?: 'NONE' | 'TEXT';
  @IsOptional() @IsString() @MaxLength(255) headerText?: string;
  @IsNotEmpty() @IsString() @MaxLength(4096) body: string;
  @IsOptional() @IsString() @MaxLength(255) footer?: string;
  @IsOptional() @IsArray() buttons?: unknown[];
  @IsOptional() @IsString() @MaxLength(128) metaTemplateId?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
