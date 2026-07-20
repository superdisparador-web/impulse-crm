import { LeadTemperature } from '@prisma/client';
import { IsEnum } from 'class-validator';
export class UpdateLeadTemperatureDto { @IsEnum(LeadTemperature) temperature: LeadTemperature; }
