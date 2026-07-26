import { IsBoolean, IsIn, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class UpdateWhatsappAccountDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phoneNumber?: string;
  @IsOptional() @IsString() @Matches(/^\d+$/) phoneNumberId?: string;
  @IsOptional() @IsString() @Matches(/^\d+$/) wabaId?: string;
  @IsOptional() @IsString() @Matches(/^\d+$/) businessAccountId?: string;
  @IsOptional() @IsString() @MinLength(20) accessToken?: string;
  @IsOptional() @IsString() @MinLength(24) verifyToken?: string;
  @IsOptional() @IsString() appId?: string;
  @IsOptional() @IsString() appSecret?: string;
  @IsOptional() @IsString() webhookSecret?: string;
  @IsOptional() @IsString() @Matches(/^v\d+\.\d+$/) apiVersion?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE', 'PENDING', 'ERROR', 'DISCONNECTED']) status?: string;
}

export class UpdateWhatsappAccountStatusDto {
  @IsIn(['ACTIVE', 'INACTIVE']) status: 'ACTIVE' | 'INACTIVE';
}
