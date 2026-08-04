import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class SystemController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  async health() {
    const startedAt = performance.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', database: { status: 'up', latencyMs: Math.round(performance.now() - startedAt) } };
    } catch {
      return { status: 'degraded', database: { status: 'down' } };
    }
  }
}
