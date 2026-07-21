import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCampaignDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @IsString() description?: string | null;
  @IsOptional() @IsString() whatsappAccountId?: string | null;
  @IsOptional() @IsString() whatsappTemplateId?: string | null;
  @IsOptional() @IsDateString() scheduledAt?: string | null;
}
