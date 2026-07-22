import { IsNotEmpty, IsString } from 'class-validator';
export class SyncWhatsappTemplatesDto { @IsNotEmpty() @IsString() accountId: string; }
