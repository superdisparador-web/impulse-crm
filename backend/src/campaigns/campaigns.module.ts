import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { AuditModule } from '../audit/audit.module';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [AuditModule, MessagingModule],
  controllers: [CampaignsController],
  providers: [CampaignsService]
})
export class CampaignsModule {}
