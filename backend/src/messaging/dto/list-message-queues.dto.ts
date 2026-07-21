import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Max, Min } from 'class-validator';
import { Priority, QueueStatus } from '@prisma/client';

export class ListMessageQueuesDto {
  @IsOptional() @Transform(({ value }) => Number(value)) @Min(1) page?: number = 1;
  @IsOptional() @Transform(({ value }) => Number(value)) @Min(1) @Max(100) limit?: number = 10;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsIn(Object.values(QueueStatus)) status?: QueueStatus;
  @IsOptional() @IsIn(Object.values(Priority)) priority?: Priority;
  @IsOptional() @IsString() campaignId?: string;
  @IsOptional() @IsString() whatsappAccountId?: string;
}
