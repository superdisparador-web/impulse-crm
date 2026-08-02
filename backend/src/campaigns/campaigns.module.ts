import { Module } from '@nestjs/common';
import { IamModule } from '../iam/iam.module';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';

@Module({
  imports: [IamModule],
  controllers: [CampaignsController],
  providers: [CampaignsService]
})
export class CampaignsModule {}
