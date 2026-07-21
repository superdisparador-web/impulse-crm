import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Max, Min } from 'class-validator';
import { QueueStatus } from '@prisma/client';
export class ListMessageLogsDto {
  @IsOptional() @Transform(({ value }) => Number(value)) @Min(1) page?: number = 1;
  @IsOptional() @Transform(({ value }) => Number(value)) @Min(1) @Max(100) limit?: number = 10;
  @IsOptional() @IsString() queueId?: string;
  @IsOptional() @IsString() campaignId?: string;
  @IsOptional() @IsString() recipientId?: string;
  @IsOptional() @IsIn(Object.values(QueueStatus)) status?: QueueStatus;
}
