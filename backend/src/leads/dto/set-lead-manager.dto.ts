import { IsOptional, IsString } from 'class-validator';
export class SetLeadManagerDto { @IsOptional() @IsString() managerUserId?: string | null; }
