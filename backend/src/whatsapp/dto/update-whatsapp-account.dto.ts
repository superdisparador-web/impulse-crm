import { IsOptional, IsString } from 'class-validator';
export class UpdateWhatsappAccountDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phoneNumber?: string;
  @IsOptional() @IsString() businessAccountId?: string;
  @IsOptional() @IsString() accessToken?: string;
  @IsOptional() @IsString() verifyToken?: string;
  @IsOptional() @IsString() appId?: string;
  @IsOptional() @IsString() appSecret?: string;
  @IsOptional() @IsString() webhookSecret?: string;
}
