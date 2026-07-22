import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class SendTextMessageDto { @IsNotEmpty() @IsString() text: string; @IsOptional() @IsString() replyToExternalMessageId?: string; }
export class SendTemplateMessageDto { @IsNotEmpty() @IsString() templateId: string; @IsOptional() @IsArray() components?: unknown[]; }
export class SendMediaMessageDto { @IsNotEmpty() @IsString() type: string; @IsNotEmpty() @IsString() mediaId: string; @IsOptional() @IsString() caption?: string; }
