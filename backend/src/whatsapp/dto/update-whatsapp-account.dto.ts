import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { OptionalId } from './optional-id.transformer';

export class UpdateWhatsappAccountDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phoneNumber?: string;
  @OptionalId() @IsOptional() @IsString() @Matches(/^\d+$/) businessAccountId?: string;
  @IsOptional() @IsString() @Matches(/^v\d+\.\d+$/) apiVersion?: string;
  @IsOptional() @IsIn(['ACTIVE', 'INACTIVE', 'PENDING', 'ERROR', 'DISCONNECTED']) status?: string;
}

export class UpdateWhatsappAccountStatusDto {
  @IsIn(['ACTIVE', 'INACTIVE']) status: 'ACTIVE' | 'INACTIVE';
}
