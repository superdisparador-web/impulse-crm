import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ContactsModule } from './contacts/contacts.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { EvolutionModule } from './evolution/evolution.module';
import { SettingsModule } from './settings/settings.module';
import { QueuesModule } from './queues/queues.module';
import { ReportsModule } from './reports/reports.module';
import { UploadsModule } from './uploads/uploads.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { LeadsModule } from './leads/leads.module';
import { MessagingModule } from './messaging/messaging.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { IamModule } from './iam/iam.module';
import { DistributionModule } from './distribution/distribution.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    PrismaModule,
    DashboardModule,
    ContactsModule,
    WhatsappModule,
    CampaignsModule,
    EvolutionModule,
    SettingsModule,
    QueuesModule,
    ReportsModule,
    UploadsModule,
    OrganizationsModule,
    LeadsModule,
    MessagingModule,
    PipelineModule,
    IamModule,
    DistributionModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
