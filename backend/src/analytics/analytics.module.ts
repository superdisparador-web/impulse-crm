import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AccessContextService } from '../auth/access-context.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRollupJob } from './jobs/analytics-rollup.job';
import { AnalyticsRepository } from './repositories/analytics.repository';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [AccessContextService, AnalyticsService, AnalyticsRepository, AnalyticsRollupJob],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
