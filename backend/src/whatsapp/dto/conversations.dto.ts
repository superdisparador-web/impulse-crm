import { IsOptional, IsString } from 'class-validator';
export class UpdateConversationDto { @IsOptional() @IsString() status?: 'OPEN'|'PENDING'|'CLOSED'|'ARCHIVED'; @IsOptional() @IsString() contactName?: string; }
export class AssignConversationDto { @IsOptional() @IsString() assignedUserId?: string | null; @IsOptional() @IsString() managerUserId?: string | null; }
