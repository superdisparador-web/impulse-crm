import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MessagingWorker } from './messaging.worker';
import { acquireScheduler, releaseScheduler } from '../jobs/scheduler-registry';

@Injectable()
export class MessagingScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessagingScheduler.name);
  private timer?: NodeJS.Timeout;
  private stopped = false;

  constructor(private readonly worker: MessagingWorker) {}

  onModuleInit() {
    this.stopped = false;
    if (!acquireScheduler('messaging', this)) {
      this.logger.log(JSON.stringify({ job: 'messaging-scheduler', event: 'scheduler_duplicate_ignored' }));
      return;
    }
    this.schedule(5000);
    this.logger.log('Messaging scheduler iniciado');
  }

  onModuleDestroy() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    releaseScheduler('messaging', this);
  }

  private schedule(delay: number) {
    if (this.stopped) return;
    this.timer = setTimeout(async () => {
      await this.worker.processOne();
      this.schedule(this.worker.nextIntervalMs);
    }, delay);
  }
}
