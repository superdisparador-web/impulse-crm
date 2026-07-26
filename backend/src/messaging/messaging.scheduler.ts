import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MessagingWorker } from './messaging.worker';
import { MessagingService } from './messaging.service';

@Injectable()
export class MessagingScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessagingScheduler.name);
  private timer?: NodeJS.Timeout;
  private reconcileTimer?: NodeJS.Timeout;

  constructor(private readonly worker: MessagingWorker, private readonly messaging:MessagingService) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.worker.processOne(), 5000);
    this.reconcileTimer=setInterval(()=>void this.messaging.reconcileOperational().catch(error=>this.logger.error('Falha na reconciliação operacional',error instanceof Error?error.stack:String(error))),Number(process.env.CAMPAIGN_RECONCILE_INTERVAL_MS||60000));
    this.logger.log('Messaging scheduler iniciado');
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    if(this.reconcileTimer)clearInterval(this.reconcileTimer);
  }
}
