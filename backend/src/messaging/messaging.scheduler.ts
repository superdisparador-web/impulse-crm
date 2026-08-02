import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MessagingWorker } from './messaging.worker';
import { MessagingService } from './messaging.service';

@Injectable()
export class MessagingScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessagingScheduler.name);
  private timer?: NodeJS.Timeout;
  private reconcileTimer?: NodeJS.Timeout;
  private stopped = false;

  constructor(private readonly worker: MessagingWorker, private readonly messaging:MessagingService) {}

  onModuleInit() {
    if (this.timer || this.reconcileTimer) return;
    this.stopped = false;
    this.scheduleWorker(0);
    this.reconcileTimer=setInterval(()=>void this.messaging.reconcileOperational().catch(error=>this.logger.error('Falha na reconciliação operacional',error instanceof Error?error.stack:String(error))),Number(process.env.CAMPAIGN_RECONCILE_INTERVAL_MS||60000));
    this.logger.log('Messaging scheduler iniciado');
  }

  onModuleDestroy() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    if(this.reconcileTimer)clearInterval(this.reconcileTimer);
    this.timer = undefined;
    this.reconcileTimer = undefined;
  }

  private scheduleWorker(delayMs: number) {
    this.timer = setTimeout(async () => {
      const result = await this.worker.processOne();
      if (!this.stopped) this.scheduleWorker(this.worker.nextDelayMs(result !== null));
    }, delayMs);
  }
}
