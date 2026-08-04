import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class StartEmbeddedSignupDto {
  @IsUrl({ require_tld: false }) returnUrl: string;
  @IsOptional() @IsString() accountId?: string;
}

export class CompleteEmbeddedSignupDto {
  @IsNotEmpty() @IsString() code: string;
  @IsNotEmpty() @IsString() state: string;
  @IsOptional() @IsString() accountId?: string;
}
