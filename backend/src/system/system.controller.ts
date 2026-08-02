import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class SystemController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async health() {
    const before = performance.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', database: { status: 'up', latencyMs: Math.round(performance.now() - before) } };
    } catch {
      return { status: 'degraded', database: { status: 'down', latencyMs: Math.round(performance.now() - before) } };
    }
  }
}
