import { Injectable, Logger } from '@nestjs/common';
import { MessagingQueueService } from './messaging-queue.service';
import { MessagingService } from './messaging.service';

@Injectable()
export class MessagingWorker {
  private readonly logger = new Logger(MessagingWorker.name);
  private running = false;
  private consecutiveFailures = 0;
  private readonly idleDelayMs = Number(process.env.MESSAGE_WORKER_IDLE_MS || 15_000);
  private readonly activeDelayMs = Number(process.env.MESSAGE_WORKER_ACTIVE_MS || 1_000);
  private readonly maxBackoffMs = Number(process.env.MESSAGE_WORKER_MAX_BACKOFF_MS || 120_000);
  constructor(private readonly messagingService: MessagingService, private readonly queueService: MessagingQueueService) {}
  async processOne() {
    if (this.running) {
      this.logger.warn('Worker de mensagens ignorado: execução anterior ainda ativa');
      return null;
    }
    if (!this.queueService.canProcess()) return null;
    this.running = true;
    try {
      const result = await this.messagingService.processNext();
      this.consecutiveFailures = 0;
      return result;
    }
    catch (error) {
      this.consecutiveFailures += 1;
      const code = (error as { code?: string }).code ?? 'UNKNOWN';
      this.logger.error(`Falha no worker de mensagens (Prisma ${code}); próxima tentativa em ${this.nextDelayMs(false)}ms`);
      return null;
    }
    finally { this.running = false; }
  }

  nextDelayMs(hadWork: boolean) {
    if (this.consecutiveFailures) return Math.min(this.idleDelayMs * 2 ** (this.consecutiveFailures - 1), this.maxBackoffMs);
    return hadWork ? this.activeDelayMs : this.idleDelayMs;
  }
}
