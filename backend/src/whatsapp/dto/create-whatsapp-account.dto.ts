import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
export class CreateWhatsappAccountDto {
  @IsNotEmpty() @IsString() name: string;
  @IsNotEmpty() @IsString() phoneNumber: string;
  @IsNotEmpty() @IsString() phoneNumberId: string;
  @IsNotEmpty() @IsString() businessAccountId: string;
  @IsNotEmpty() @IsString() accessToken: string;
  @IsNotEmpty() @IsString() verifyToken: string;
  @IsOptional() @IsString() appId?: string;
  @IsOptional() @IsString() appSecret?: string;
  @IsOptional() @IsString() webhookSecret?: string;
}
