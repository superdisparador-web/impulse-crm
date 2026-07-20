import { Module } from '@nestjs/common';
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

@Module({
  imports: [AuthModule, UsersModule, PrismaModule, DashboardModule, ContactsModule, WhatsappModule, CampaignsModule, EvolutionModule, SettingsModule, QueuesModule, ReportsModule, UploadsModule, OrganizationsModule]
})
export class AppModule {}
