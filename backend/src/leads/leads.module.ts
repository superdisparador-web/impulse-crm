import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { IamModule } from '../iam/iam.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { TimelineService } from './timeline.service';

@Module({ imports: [PrismaModule, AuthModule, IamModule, AuditModule, AnalyticsModule], controllers: [LeadsController], providers: [LeadsService, TimelineService] })
export class LeadsModule {}
