import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { CampaignStatus, LeadSource, Prisma } from '@prisma/client';
import { AccessContextService, AuthenticatedUserRef } from '../auth/access-context.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReportQueryDto } from './dto/report-query.dto';

function csvCell(value: unknown) {
  const raw = value instanceof Date ? value.toISOString() : String(value ?? '');
  const neutralized = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${neutralized.replace(/"/g, '""')}"`;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService, private readonly access: AccessContextService) {}

  async csv(query: ReportQueryDto, user: AuthenticatedUserRef) {
    const ctx = await this.access.resolve(user);
    const organizationId = ctx.global ? query.organizationId : ctx.organizationId;
    if (!organizationId || (!ctx.global && query.organizationId && query.organizationId !== organizationId)) throw new ForbiddenException('Organização inválida');
    const period = query.from || query.to ? { ...(query.from ? { gte: new Date(query.from) } : {}), ...(query.to ? { lte: new Date(query.to) } : {}) } : undefined;
    if (query.source && !Object.values(LeadSource).includes(query.source as LeadSource)) throw new BadRequestException('Origem inválida');
    if (query.dataset === 'campaigns' && query.status && !Object.values(CampaignStatus).includes(query.status as CampaignStatus)) throw new BadRequestException('Status de campanha inválido');
    const commercialLeadFilter: Prisma.LeadWhereInput = {
      organizationId,
      ...(query.source ? { source: query.source as LeadSource } : {}),
      ...(query.managerId ? { managerUserId: query.managerId } : {}),
      ...(query.product || query.development ? { AND: [
        ...(query.product ? [{ metadata: { path: ['product'], string_contains: query.product, mode: 'insensitive' as const } }] : []),
        ...(query.development ? [{ metadata: { path: ['development'], string_contains: query.development, mode: 'insensitive' as const } }] : []),
      ] } : {}),
    };
    const requiresLeadFilter = Boolean(query.source || query.managerId || query.product || query.development);
    const scopedLeadIds = requiresLeadFilter ? (await this.prisma.lead.findMany({ where: commercialLeadFilter, select: { id: true }, take: 10_000 })).map((lead) => lead.id) : undefined;
    if (query.dataset === 'events') {
      const rows = await this.prisma.analyticsEvent.findMany({ where: { organizationId, ...(period ? { occurredAt: period } : {}), ...(query.campaignId ? { campaignId: query.campaignId } : {}), ...(query.status ? { eventType: query.status } : {}), ...(scopedLeadIds ? { leadId: { in: scopedLeadIds } } : {}) }, orderBy: { occurredAt: 'desc' }, take: 10_000 });
      return this.serialize(['evento', 'origem', 'campanha', 'lead', 'corretor', 'gerente', 'data'], rows.map((row) => [row.eventType, row.source, row.campaignId, row.leadId, row.brokerUserId, row.managerUserId, row.occurredAt]));
    }
    if (query.dataset === 'conversions') {
      const rows = await this.prisma.deal.findMany({ where: { organizationId, status: 'WON', ...(period ? { wonAt: period } : {}), ...(query.brokerId ? { ownerId: query.brokerId } : {}), ...(scopedLeadIds ? { leadId: { in: scopedLeadIds } } : {}) }, select: { id: true, title: true, closedValue: true, wonAt: true, owner: { select: { name: true } }, lead: { select: { name: true, source: true } } }, orderBy: { wonAt: 'desc' }, take: 10_000 });
      return this.serialize(['negocio', 'lead', 'origem', 'corretor', 'valor', 'data'], rows.map((row) => [row.title, row.lead.name, row.lead.source, row.owner?.name, row.closedValue, row.wonAt]));
    }
    const rows = await this.prisma.campaign.findMany({ where: { organizationId, deletedAt: null, ...(period ? { createdAt: period } : {}), ...(query.campaignId ? { id: query.campaignId } : {}), ...(query.templateId ? { whatsappTemplateId: query.templateId } : {}), ...(query.status ? { status: query.status as CampaignStatus } : {}), ...(query.brokerId ? { agents: { some: { userId: query.brokerId } } } : {}), ...(scopedLeadIds ? { recipients: { some: { leadId: { in: scopedLeadIds } } } } : {}) }, select: { name: true, status: true, totalContacts: true, totalSent: true, totalDelivered: true, totalRead: true, totalClicked: true, totalFailed: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 10_000 });
    return this.serialize(['campanha', 'status', 'contatos', 'enviadas', 'entregues', 'lidas', 'cliques', 'falhas', 'data'], rows.map((row) => Object.values(row)));
  }

  private serialize(header: string[], rows: unknown[][]) {
    return [header.map(csvCell).join(','), ...rows.map((row) => row.map(csvCell).join(','))].join('\r\n');
  }
}
