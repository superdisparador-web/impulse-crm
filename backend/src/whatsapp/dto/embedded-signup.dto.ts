import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CompleteEmbeddedSignupDto {
  @IsNotEmpty() @IsString() code: string;
  @IsNotEmpty() @IsString() state: string;
  @IsOptional() @IsString() accountId?: string;
}
