import { ArrayMinSize, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
export class ListMappingDto { @IsString() phoneColumn:string; @IsOptional() @IsString() nameColumn?:string; @IsArray() @IsString({each:true}) includedColumns:string[]; @IsBoolean() confirmed:boolean; }
export class VariableMappingDto { @IsIn(['HEADER','BODY','BUTTON']) component:string; @IsInt() @Min(1) position:number; @IsIn(['COLUMN','FIXED','LEAD_NAME','LEAD_PHONE','SYSTEM_FIELD']) sourceType:string; @IsOptional() @IsString() sourceColumn?:string; @IsOptional() @IsString() @MaxLength(1024) fixedValue?:string; @IsOptional() @IsInt() @Min(0) buttonIndex?:number; }
export class TemplateConfigurationDto { @IsString() whatsappTemplateId:string; @IsArray() @ValidateNested({each:true}) @Type(()=>VariableMappingDto) variableMappings:VariableMappingDto[]; }
export class AgentDto { @IsString() userId:string; @IsInt() @Min(0) position:number; @IsOptional() @IsInt() @Min(1) @Max(100) weight?:number; @IsOptional() @IsBoolean() active?:boolean; }
export class DestinationDto { @IsIn(['FIXED_URL','ROUND_ROBIN','AGENT_FIXED']) mode:string; @IsOptional() @IsUrl({protocols:['https'],require_protocol:true}) fixedUrl?:string; @IsOptional() @IsString() agentId?:string; @IsOptional() @IsArray() @ArrayMinSize(1) @ValidateNested({each:true}) @Type(()=>AgentDto) agents?:AgentDto[]; @IsOptional() @IsInt() @Min(0) initialIndex?:number; }
export class StepDto { @IsInt() @Min(1) @Max(4) currentStep:number; }
export class ReviewDto { @IsBoolean() confirmed:boolean; }
