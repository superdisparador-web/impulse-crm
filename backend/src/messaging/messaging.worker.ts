import { Injectable, Logger } from '@nestjs/common';
import { MessagingQueueService } from './messaging-queue.service';
import { MessagingService } from './messaging.service';

@Injectable()
export class MessagingWorker {
  private readonly logger = new Logger(MessagingWorker.name);
  private running = false;
  constructor(private readonly messagingService: MessagingService, private readonly queueService: MessagingQueueService) {}
  async processOne() {
    if (this.running || !this.queueService.canProcess()) return null;
    this.running = true;
    try { return await this.messagingService.processNext(); }
    catch (error) { this.logger.error('Falha no worker de mensagens', error instanceof Error ? error.stack : String(error)); return null; }
    finally { this.running = false; }
  }
}
