import { Logger } from '@nestjs/common';

const RETRYABLE_PRISMA_CODES = new Set(['P2024', 'P2028', 'P1001']);

export function prismaErrorCode(error: unknown): string | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current && typeof current === 'object'; depth += 1) {
    const candidate = current as { code?: unknown; errorCode?: unknown; message?: unknown; cause?: unknown };
    if (typeof candidate.code === 'string') return candidate.code;
    if (typeof candidate.errorCode === 'string') return candidate.errorCode;
    if (typeof candidate.message === 'string' && /can't reach database server/i.test(candidate.message)) return 'P1001';
    current = candidate.cause;
  }
  return undefined;
}

export class SerializedJob {
  private running = false;
  private failures = 0;

  constructor(
    private readonly job: string,
    private readonly normalIntervalMs: number,
    private readonly logger: Logger,
    private readonly maximumIntervalMs = 5 * 60_000,
  ) {}

  get nextIntervalMs() {
    return Math.min(this.normalIntervalMs * 2 ** this.failures, this.maximumIntervalMs);
  }

  async run<T>(operation: () => Promise<T>): Promise<T | undefined> {
    if (this.running) {
      this.log('skipped_locked', undefined, 0);
      return undefined;
    }
    this.running = true;
    const started = Date.now();
    try {
      const result = await operation();
      const recovered = this.failures > 0;
      this.failures = 0;
      this.log(recovered ? 'recovered' : 'success', undefined, Date.now() - started);
      return result;
    } catch (error) {
      const code = prismaErrorCode(error);
      if (code && RETRYABLE_PRISMA_CODES.has(code)) this.failures += 1;
      this.log('failure', code, Date.now() - started);
      return undefined;
    } finally {
      this.running = false;
    }
  }

  private log(event: string, prismaCode: string | undefined, durationMs: number) {
    this.logger.log(JSON.stringify({
      job: this.job,
      event,
      prismaCode: prismaCode ?? null,
      durationMs,
      consecutiveFailures: this.failures,
      nextIntervalMs: this.nextIntervalMs,
    }));
  }
}
