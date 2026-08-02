import { Injectable, Logger } from '@nestjs/common';
import { MessagingQueueService } from './messaging-queue.service';
import { MessagingService } from './messaging.service';

@Injectable()
export class MessagingWorker {
  private readonly logger = new Logger(MessagingWorker.name);
  private running = false;
  private activeExecutions = 0;
  private executionSequence = 0;
  constructor(private readonly messagingService: MessagingService, private readonly queueService: MessagingQueueService) {}
  async processOne() {
    if (this.running || !this.queueService.canProcess()) return null;
    const executionId = `messaging-worker-${++this.executionSequence}`;
    const startedAt = new Date();
    const startTime = Date.now();
    let eventsProcessed = 0;
    let errors = 0;
    const transactionsExecuted = 0;
    this.running = true;
    this.activeExecutions += 1;
    this.logTelemetry('MESSAGING_WORKER_EXECUTION_STARTED', {
      executionId,
      timestamp: startedAt.toISOString(),
      simultaneousExecutions: this.activeExecutions,
    });
    try {
      const result = await this.messagingService.processNext();
      eventsProcessed = result ? 1 : 0;
      return result;
    } catch (error) {
      errors += 1;
      this.logger.error('Falha no worker de mensagens', error instanceof Error ? error.stack : String(error));
      return null;
    } finally {
      const finishedAt = new Date();
      this.running = false;
      this.activeExecutions -= 1;
      this.logTelemetry('MESSAGING_WORKER_EXECUTION_FINISHED', {
        executionId,
        timestamp: finishedAt.toISOString(),
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: Date.now() - startTime,
        eventsProcessed,
        transactionsExecuted,
        errors,
        simultaneousExecutions: this.activeExecutions,
      });
    }
  }

  private logTelemetry(event: string, data: Record<string, unknown>) {
    this.logger.log(JSON.stringify({ event, ...data }));
  }
}
