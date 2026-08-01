import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';
export class SendCampaignTestDto {
  @IsString() @MaxLength(64) phone!:string;
  @IsString() @MaxLength(128) idempotencyKey!:string;
  @IsOptional() @IsArray() values?:Array<{component:'HEADER'|'BODY'|'BUTTON';position:number;buttonIndex?:number;value:string}>;
}
