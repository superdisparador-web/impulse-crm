import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWhatsappAccountDto {
  @IsNotEmpty()
  @IsString()
  organizationId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  phoneNumberId: string;

  @IsNotEmpty()
  @IsString()
  businessAccountId: string;

  @IsNotEmpty()
  @IsString()
  accessToken: string;

  @IsNotEmpty()
  @IsString()
  verifyToken: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @IsOptional()
  @IsIn(['CONNECTED', 'DISCONNECTED'])
  status?: 'CONNECTED' | 'DISCONNECTED';
}
