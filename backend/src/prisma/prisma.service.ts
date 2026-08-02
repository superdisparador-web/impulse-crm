import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { hostname } from 'node:os';

type TelemetryContext = Record<string, unknown>;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly telemetryLogger = new Logger('PrismaPoolTelemetry');
  readonly processIdentity = {
    pid: process.pid,
    instanceId: process.env.INSTANCE_ID ?? process.env.HOSTNAME ?? `${hostname()}-${process.pid}`,
  };

  async onModuleInit() {
    await this.$connect();
    void this.logPoolSnapshot('PRISMA_POOL_CONNECTED');
  }

  async logPoolSnapshot(event: string, context: TelemetryContext = {}) {
    try {
      const metrics = await this.$metrics.json({ globalLabels: { instanceId: this.processIdentity.instanceId } });
      const gauges = Object.fromEntries(metrics.gauges.map((metric) => [metric.key, metric.value]));
      this.telemetryLogger.log(JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        ...this.processIdentity,
        connectionsOpen: gauges.prisma_pool_connections_open ?? null,
        connectionsBusy: gauges.prisma_pool_connections_busy ?? null,
        connectionsIdle: gauges.prisma_pool_connections_idle ?? null,
        queriesActive: gauges.prisma_client_queries_active ?? null,
        queriesWaiting: gauges.prisma_client_queries_wait ?? null,
        ...context,
      }));
    } catch (error) {
      this.telemetryLogger.error(JSON.stringify({
        event: 'PRISMA_POOL_SNAPSHOT_FAILED',
        timestamp: new Date().toISOString(),
        ...this.processIdentity,
        requestedEvent: event,
        error: this.errorDetails(error),
        ...context,
      }));
    }
  }

  errorDetails(error: unknown) {
    if (!(error instanceof Error)) return { value: String(error) };
    const candidate = error as Error & { code?: string; clientVersion?: string };
    return { name: candidate.name, message: candidate.message, code: candidate.code, clientVersion: candidate.clientVersion, stack: candidate.stack };
  }
}
