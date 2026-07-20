import { IsNotEmpty, IsString } from 'class-validator';

export class SyncWhatsappTemplatesDto {
  @IsNotEmpty()
  @IsString()
  organizationId: string;

  @IsNotEmpty()
  @IsString()
  accountId: string;
}
