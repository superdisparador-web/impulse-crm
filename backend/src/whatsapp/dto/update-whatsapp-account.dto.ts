import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateWhatsappAccountDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phoneNumber?: string;
  @IsOptional() @IsString() phoneNumberId?: string;
  @IsOptional() @IsString() businessAccountId?: string;
  @IsOptional() @IsString() accessToken?: string;
  @IsOptional() @IsString() verifyToken?: string;
  @IsOptional() @IsString() appId?: string;
  @IsOptional() @IsString() appSecret?: string;
  @IsOptional() @IsString() webhookSecret?: string;
  @IsOptional() @IsString() apiVersion?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE', 'PENDING', 'ERROR', 'DISCONNECTED']) status?: string;
}

export class UpdateWhatsappAccountStatusDto {
  @IsIn(['ACTIVE', 'INACTIVE']) status: 'ACTIVE' | 'INACTIVE';
}
