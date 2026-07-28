import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { OptionalId } from './optional-id.transformer';

export class CreateWhatsappAccountDto {
  @IsNotEmpty() @IsString() name: string;
  @IsOptional() @IsString() phoneNumber?: string;
  @IsNotEmpty() @IsString() @Matches(/^\d+$/) phoneNumberId: string;
  @IsNotEmpty() @IsString() @Matches(/^\d+$/) wabaId: string;
  @OptionalId() @IsOptional() @IsString() @Matches(/^\d+$/) businessAccountId?: string;
  @IsNotEmpty() @IsString() @MinLength(20) accessToken: string;
  @IsOptional() @IsString() @MinLength(24) verifyToken?: string;
  @IsOptional() @IsString() appId?: string;
  @IsOptional() @IsString() appSecret?: string;
  @IsOptional() @IsString() webhookSecret?: string;
  @IsOptional() @IsString() @Matches(/^v\d+\.\d+$/) apiVersion?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE', 'PENDING', 'ERROR', 'DISCONNECTED']) status?: string;
}
