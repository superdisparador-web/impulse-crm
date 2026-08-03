import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MessagingWorker } from './messaging.worker';
import { acquireScheduler, releaseScheduler } from '../jobs/scheduler-registry';
import { AppLifecycleService } from '../app-lifecycle.service';

@Injectable()
export class MessagingScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessagingScheduler.name);
  private timer?: NodeJS.Timeout;
  private stopped = false;
  private unregisterShutdown?: () => void;

  constructor(private readonly worker: MessagingWorker, private readonly lifecycle?: AppLifecycleService) {}

  onModuleInit() {
    this.stopped = false;
    this.unregisterShutdown = this.lifecycle?.onShutdown(() => this.stop());
    if (!acquireScheduler('messaging', this)) {
      this.logger.log(JSON.stringify({ job: 'messaging-scheduler', event: 'scheduler_duplicate_ignored' }));
      return;
    }
    this.schedule(5000);
    this.logger.log('Messaging scheduler iniciado');
  }

  onModuleDestroy() {
    this.stop();
    this.unregisterShutdown?.();
    this.unregisterShutdown = undefined;
    releaseScheduler('messaging', this);
  }

  private stop() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
  }

  private schedule(delay: number) {
    if (this.stopped) return;
    this.timer = setTimeout(async () => {
      await this.worker.processOne();
      if (this.stopped || this.lifecycle?.isShuttingDown()) return;
      this.schedule(this.worker.nextIntervalMs);
    }, delay);
  }
}
