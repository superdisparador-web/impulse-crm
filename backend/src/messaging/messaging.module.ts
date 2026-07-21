import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MessagingController } from './messaging.controller';
import { MessagingQueueService } from './messaging-queue.service';
import { MessagingScheduler } from './messaging.scheduler';
import { MessagingService } from './messaging.service';
import { MessagingWorker } from './messaging.worker';

@Module({ imports: [PrismaModule], controllers: [MessagingController], providers: [MessagingService, MessagingQueueService, MessagingWorker, MessagingScheduler], exports: [MessagingService, MessagingQueueService] })
export class MessagingModule {}
