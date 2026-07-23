import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

export const campaignFilterFields = ['city','source','pipelineId','stageId','status','managerId','brokerId','date','temperature','archived'] as const;
export type CampaignFilterField = (typeof campaignFilterFields)[number];

export class CampaignFilterDto {
  @IsIn(campaignFilterFields)
  field: CampaignFilterField;

  @IsIn(['equals','in','between','gte','lte','contains','is'])
  operator: 'equals'|'in'|'between'|'gte'|'lte'|'contains'|'is';

  @IsOptional()
  value?: string | string[] | boolean | { from?: string; to?: string };
}

export class CampaignFiltersPayloadDto {
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CampaignFilterDto)
  filters?: CampaignFilterDto[];
}
