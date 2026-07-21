import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InboundMessageService } from './inbound-message.service';
import { MediaService } from './media.service';
import { MessageStatusService } from './message-status.service';
import { MetaWebhookService } from './meta-webhook.service';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

@Module({ imports: [PrismaModule], controllers: [WebhookController], providers: [WebhookService, MetaWebhookService, MessageStatusService, InboundMessageService, MediaService], exports: [WebhookService, MetaWebhookService] })
export class WebhookModule {}
