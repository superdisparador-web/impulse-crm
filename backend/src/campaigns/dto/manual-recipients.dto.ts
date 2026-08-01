import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
class ManualRecipientDto { @IsOptional() @IsString() @MaxLength(255) name?:string; @IsString() @MaxLength(64) phone!:string; }
export class ManualRecipientsDto { @IsArray() @ArrayMinSize(1) @ArrayMaxSize(500) @ValidateNested({each:true}) @Type(()=>ManualRecipientDto) recipients!:ManualRecipientDto[]; }
