import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MessagingWorker } from './messaging.worker';

@Injectable()
export class MessagingScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessagingScheduler.name);
  private timer?: NodeJS.Timeout;
  constructor(private readonly worker: MessagingWorker) {}
  onModuleInit() { this.timer = setInterval(() => void this.worker.processOne(), 5000); this.logger.log('Messaging scheduler iniciado em modo simulado'); }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
}
