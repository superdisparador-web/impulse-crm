import { IsBoolean, IsEmail, IsHexColor, IsIn, IsInt, IsOptional, IsString, IsUrl, Matches, Max, MaxLength, Min } from 'class-validator';

export class UpdateMeSettingsDto {
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(32) phone?: string;
  @IsOptional() @IsUrl({ require_protocol: true }) @MaxLength(500) avatarUrl?: string;
  @IsOptional() @IsIn(['pt-BR', 'en-US', 'es']) language?: string;
  @IsOptional() @IsString() @MaxLength(80) timezone?: string;
  @IsOptional() @IsIn(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']) dateFormat?: string;
}
export class UpdateOrganizationSettingsDto {
  @IsOptional() @IsString() @MaxLength(255) name?: string;
  @IsOptional() @IsString() @MaxLength(255) legalName?: string;
  @IsOptional() @IsString() @MaxLength(32) document?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(32) phone?: string;
  @IsOptional() @IsString() @MaxLength(80) timezone?: string;
}
export class UpdateNotificationSettingsDto {
  @IsOptional() @IsBoolean() notifyInApp?: boolean;
  @IsOptional() @IsBoolean() notifyEmail?: boolean;
  @IsOptional() @IsBoolean() notifyWhatsapp?: boolean;
  @IsOptional() @IsBoolean() notifyNewLeads?: boolean;
  @IsOptional() @IsBoolean() notifySla?: boolean;
  @IsOptional() @IsBoolean() notifyCampaigns?: boolean;
  @IsOptional() @IsBoolean() notifySecurity?: boolean;
  @IsOptional() @IsBoolean() notifyLeadFailures?: boolean;
  @IsOptional() @IsBoolean() notifyWhatsappHealth?: boolean;
}
export class UpdateBrandingSettingsDto {
  @IsOptional() @IsString() @MaxLength(255) displayName?: string;
  @IsOptional() @IsUrl({ require_protocol: true }) @MaxLength(500) logoUrl?: string;
  @IsOptional() @IsUrl({ require_protocol: true }) @MaxLength(500) faviconUrl?: string;
  @IsOptional() @IsHexColor() primaryColor?: string;
  @IsOptional() @IsHexColor() secondaryColor?: string;
  @IsOptional() @IsString() @MaxLength(500) signature?: string;
  @IsOptional() @IsString() @MaxLength(500) footer?: string;
}
export class UpdateOperationalSettingsDto {
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) businessStartsAt?: string;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) businessEndsAt?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100000) dailyLeadLimit?: number;
  @IsOptional() @IsInt() @Min(1) @Max(10080) slaMinutes?: number;
  @IsOptional() @IsInt() @Min(1) @Max(20) contactAttempts?: number;
  @IsOptional() @IsInt() @Min(1) @Max(10080) redistributionMinutes?: number;
  @IsOptional() @IsBoolean() roundRobin?: boolean;
}
export class UpdateSecuritySettingsDto {
  @IsOptional() @IsInt() @Min(15) @Max(43200) sessionTtlMinutes?: number;
  @IsOptional() @IsInt() @Min(3) @Max(20) maxLoginAttempts?: number;
}
export class UpdateSystemSettingsDto {
  @IsOptional() @IsInt() @Min(15) @Max(43200) defaultSessionMinutes?: number;
  @IsOptional() @IsInt() @Min(1) @Max(100000) defaultLeadLimit?: number;
  @IsOptional() @IsBoolean() maintenanceMode?: boolean;
  @IsOptional() @IsBoolean() allowOrganizationBranding?: boolean;
}
