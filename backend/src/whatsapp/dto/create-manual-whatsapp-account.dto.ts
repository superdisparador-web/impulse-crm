import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { OptionalId } from './optional-id.transformer';

/** Credentials accepted only by the GLOBAL_ADMIN manual provisioning endpoint. */
export class CreateManualWhatsappAccountDto {
  @IsNotEmpty() @IsString() organizationId: string;
  @IsNotEmpty() @IsString() name: string;
  @IsNotEmpty() @IsString() @Matches(/^\d+$/) phoneNumberId: string;
  @IsNotEmpty() @IsString() @Matches(/^\d+$/) wabaId: string;
  @OptionalId() @IsOptional() @IsString() @Matches(/^\d+$/) businessAccountId?: string;
  @IsNotEmpty() @IsString() @MinLength(20) accessToken: string;
  @IsOptional() @IsString() @Matches(/^v\d+\.\d+$/) apiVersion?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}
