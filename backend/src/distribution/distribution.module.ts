import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { IamModule } from '../iam/iam.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { DistributionController } from './distribution.controller';
import { DistributionImportService } from './distribution-import.service';
import { DistributionService } from './distribution.service';
import { CampaignClickService } from './campaign-click.service';
import { PublicRedirectController } from './public-redirect.controller';

@Module({ imports: [PrismaModule, AuthModule, IamModule, AuditModule, AnalyticsModule], controllers: [DistributionController, PublicRedirectController], providers: [DistributionService, DistributionImportService, CampaignClickService], exports: [DistributionService] })
export class DistributionModule {}
