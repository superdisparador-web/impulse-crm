import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWhatsappAccountDto {
  @IsNotEmpty() @IsString() name: string;
  @IsOptional() @IsString() phoneNumber?: string;
  @IsNotEmpty() @IsString() phoneNumberId: string;
  @IsNotEmpty() @IsString() businessAccountId: string;
  @IsNotEmpty() @IsString() accessToken: string;
  @IsOptional() @IsString() verifyToken?: string;
  @IsOptional() @IsString() appId?: string;
  @IsOptional() @IsString() appSecret?: string;
  @IsOptional() @IsString() webhookSecret?: string;
  @IsOptional() @IsString() apiVersion?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE', 'PENDING', 'ERROR', 'DISCONNECTED']) status?: string;
}
