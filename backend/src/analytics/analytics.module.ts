import { Module } from '@nestjs/common';
import { AccessContextService } from '../auth/access-context.service';
import { IamModule } from '../iam/iam.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsEventsService } from './analytics-events.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRollupJob } from './jobs/analytics-rollup.job';
import { AnalyticsRepository } from './repositories/analytics.repository';

@Module({ imports: [PrismaModule, IamModule], controllers: [AnalyticsController], providers: [AccessContextService, AnalyticsService, AnalyticsEventsService, AnalyticsRepository, AnalyticsRollupJob], exports: [AnalyticsService, AnalyticsEventsService] })
export class AnalyticsModule {}
