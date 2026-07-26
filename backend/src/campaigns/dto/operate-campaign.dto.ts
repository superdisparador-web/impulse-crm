import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class ScheduleCampaignDto { @IsDateString() scheduledAt!: string; }
export class CampaignReasonDto { @IsOptional() @IsString() @MaxLength(500) reason?: string; }

