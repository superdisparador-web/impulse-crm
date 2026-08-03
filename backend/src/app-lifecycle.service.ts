import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class AppLifecycleService implements OnApplicationShutdown {
  private readonly logger = new Logger(AppLifecycleService.name);
  private shuttingDown = false;
  private readonly callbacks = new Set<() => void>();

  beginShutdown(): void {
    if (this.shuttingDown) return;
    this.shuttingDown = true;
    this.logger.log('Backend shutdown started');
    for (const callback of this.callbacks) callback();
  }

  isShuttingDown(): boolean {
    return this.shuttingDown;
  }

  onShutdown(callback: () => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  onApplicationShutdown(): void {
    this.beginShutdown();
    this.logger.log('Backend shutdown completed');
  }
}
