import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCampaignDto {
  @IsString() @MinLength(1) name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() whatsappAccountId?: string;
  @IsOptional() @IsString() whatsappTemplateId?: string;
  @IsOptional() @IsDateString() scheduledAt?: string;
}
