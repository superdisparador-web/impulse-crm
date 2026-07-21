import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListWebhookOverviewDto } from './dto/list-webhook-overview.dto';

const eventSelect = {
  id: true,
  provider: true,
  eventType: true,
  status: true,
  whatsappAccountId: true,
  phoneNumberId: true,
  metaMessageId: true,
  errorMessage: true,
  signatureValid: true,
  processedAt: true,
  createdAt: true,
} satisfies Prisma.WebhookEventSelect;

const inboundSelect = {
  id: true,
  whatsappAccountId: true,
  phoneNumberId: true,
  from: true,
  customerName: true,
  metaMessageId: true,
  type: true,
  text: true,
  receivedAt: true,
  createdAt: true,
  mediaFiles: { select: { id: true, metaMediaId: true, type: true, mimeType: true, fileName: true, downloadStatus: true, createdAt: true } },
} satisfies Prisma.InboundMessageSelect;

@Injectable()
export class WebhookService {
  constructor(private readonly prisma: PrismaService) {}

  health() {
    return { status: 'ok', provider: 'meta', timestamp: new Date().toISOString() };
  }

  async overview(userId: string, query: ListWebhookOverviewDto) {
    const organizationId = await this.getOrganizationId(userId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const eventWhere = { organizationId } satisfies Prisma.WebhookEventWhereInput;
    const errorWhere = { organizationId, OR: [{ status: 'FAILED' as const }, { eventType: 'errors' }] } satisfies Prisma.WebhookEventWhereInput;
    const inboundWhere = { organizationId } satisfies Prisma.InboundMessageWhereInput;
    const [events, errors, inboundMessages, totals, totalEvents, totalErrors, totalInboundMessages] = await Promise.all([
      this.prisma.webhookEvent.findMany({ select: eventSelect, where: eventWhere, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.webhookEvent.findMany({ select: eventSelect, where: errorWhere, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.inboundMessage.findMany({ select: inboundSelect, where: inboundWhere, orderBy: { receivedAt: 'desc' }, skip, take: limit }),
      this.prisma.webhookEvent.groupBy({ by: ['eventType'], where: eventWhere, _count: { _all: true }, orderBy: { eventType: 'asc' } }),
      this.prisma.webhookEvent.count({ where: eventWhere }),
      this.prisma.webhookEvent.count({ where: errorWhere }),
      this.prisma.inboundMessage.count({ where: inboundWhere }),
    ]);
    return {
      health: this.health(),
      events,
      errors,
      inboundMessages,
      totals: totals.map((total) => ({ eventType: total.eventType, total: total._count._all })),
      meta: { page, limit, totalEvents, totalErrors, totalInboundMessages },
    };
  }

  private async getOrganizationId(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, active: true, deletedAt: null, organization: { active: true, deletedAt: null } },
      select: { organizationId: true },
    });
    if (!user?.organizationId) throw new ForbiddenException('Usuário sem organização ativa');
    return user.organizationId;
  }
}
