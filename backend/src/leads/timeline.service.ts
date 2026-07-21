import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const timelineEventInclude = { actorUser: { select: { id: true, name: true, email: true } } } satisfies Prisma.LeadEventInclude;

@Injectable()
export class TimelineService {
  constructor(private readonly prisma: PrismaService) {}

  async forLead(leadId: string, organizationId: string) {
    const leadEvents = await this.prisma.leadEvent.findMany({
      where: { leadId, organizationId },
      include: timelineEventInclude,
      orderBy: { occurredAt: 'desc' },
    });

    return {
      leadId,
      items: leadEvents.map((event) => ({ source: 'LEADS' as const, occurredAt: event.occurredAt, event })),
      note: 'TimelineService consolida dinamicamente eventos existentes e não armazena dados próprios.',
    };
  }
}
