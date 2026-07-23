import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PipelineController } from './pipeline.controller';
import { PipelineService } from './pipeline.service';

@Module({ imports: [PrismaModule, AuthModule, AuditModule, AnalyticsModule], controllers: [PipelineController], providers: [PipelineService], exports: [PipelineService] })
export class PipelineModule {}
