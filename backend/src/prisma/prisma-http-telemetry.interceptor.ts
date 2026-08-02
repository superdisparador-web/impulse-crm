import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { PrismaService } from './prisma.service';

type HealthResponse = { database?: { status?: string } };

@Injectable()
export class PrismaHttpTelemetryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PrismaHttpTelemetryInterceptor.name);
  private databaseStatus?: string;

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ method?: string; originalUrl?: string; url?: string }>();
    const method = request.method ?? 'UNKNOWN';
    const path = request.originalUrl ?? request.url ?? 'UNKNOWN';
    const pathname = path.split('?')[0];
    const startedAt = Date.now();

    return next.handle().pipe(
      tap((body: HealthResponse) => {
        if (!pathname.endsWith('/api/health') && !pathname.endsWith('/health')) return;
        const status = body?.database?.status?.toUpperCase();
        if (!status || status === this.databaseStatus) return;
        const previousStatus = this.databaseStatus;
        this.databaseStatus = status;
        const event = previousStatus === 'UP' && status === 'DOWN' ? 'DATABASE_HEALTH_UP_TO_DOWN' : 'DATABASE_HEALTH_STATUS_CHANGED';
        this.logger.warn(JSON.stringify({ event, timestamp: new Date().toISOString(), ...this.prisma.processIdentity, previousStatus, status, method, path, durationMs: Date.now() - startedAt }));
        void this.prisma.logPoolSnapshot(`${event}_POOL`, { previousStatus, status, method, path });
      }),
      catchError((error: unknown) => {
        const details = this.prisma.errorDetails(error);
        const message = 'message' in details ? details.message : '';
        const code = 'code' in details ? details.code : undefined;
        if (code === 'P2024' || /connection pool|acquir|timed?\s*out/i.test(message ?? '')) {
          this.logger.error(JSON.stringify({ event: 'HTTP_PRISMA_CONNECTION_ACQUIRE_TIMEOUT', timestamp: new Date().toISOString(), ...this.prisma.processIdentity, method, path, durationMs: Date.now() - startedAt, error: details }));
          void this.prisma.logPoolSnapshot('HTTP_PRISMA_CONNECTION_ACQUIRE_TIMEOUT_POOL', { method, path });
        }
        return throwError(() => error);
      }),
    );
  }
}
