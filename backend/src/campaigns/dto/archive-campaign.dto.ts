import { IsBoolean } from 'class-validator';
export class ArchiveCampaignDto { @IsBoolean() archived: boolean; }
