import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CampaignFilterField, CampaignFilterOperator, CampaignStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { ListCampaignsDto } from './dto/list-campaigns.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignFilterDto } from './dto/campaign-filter.dto';

const finalCampaignStatuses = ['COMPLETED', 'CANCELED'] as const;
const fieldMap: Record<string, CampaignFilterField> = { city:'CITY', source:'SOURCE', pipelineId:'PIPELINE', stageId:'STAGE', status:'STATUS', managerId:'MANAGER', brokerId:'BROKER', date:'DATE', temperature:'TEMPERATURE', archived:'ARCHIVED' };
const operatorMap: Record<string, CampaignFilterOperator> = { equals:'EQUALS', in:'IN', between:'BETWEEN', gte:'GTE', lte:'LTE', contains:'CONTAINS', is:'IS' };

const safeUserSelect = { id: true, name: true, email: true, phone: true, role: true, active: true, organizationId: true } satisfies Prisma.UserSelect;
const campaignInclude = { filters: { orderBy: { createdAt: 'asc' as const } }, createdBy: { select: safeUserSelect }, _count: { select: { recipients: true, filters: true } } } satisfies Prisma.CampaignInclude;

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: ListCampaignsDto) {
    const organizationId = await this.getOrganizationId(userId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.CampaignWhereInput = {
      organizationId,
      deletedAt: query.deleted ? { not: null } : null,
      ...(query.archived ? { archivedAt: { not: null } } : { archivedAt: null }),
      ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { description: { contains: query.search, mode: 'insensitive' } }] } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.campaignType ? { campaignType: query.campaignType } : {}),
      ...(query.from || query.to ? { createdAt: { ...(query.from ? { gte: new Date(query.from) } : {}), ...(query.to ? { lte: new Date(query.to) } : {}) } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.campaign.findMany({ where, include: campaignInclude, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.campaign.count({ where }),
    ]);
    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(userId: string, id: string) { return this.getCampaign(userId, id, true); }

  async create(userId: string, data: CreateCampaignDto) {
    const organizationId = await this.getOrganizationId(userId);
    this.validateName(data.name);
    this.validateFilters(data.filters ?? []);
    return this.prisma.campaign.create({ data: { organizationId, createdById: userId, name: data.name.trim(), description: data.description?.trim() || null, campaignType: data.campaignType, status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT', scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null, filters: { create: this.mapFilters(data.filters ?? []) } }, include: campaignInclude });
  }

  async update(userId: string, id: string, data: UpdateCampaignDto) {
    const current = await this.getCampaign(userId, id);
    if (finalCampaignStatuses.includes(current.status as (typeof finalCampaignStatuses)[number])) throw new BadRequestException('Campanhas concluídas ou canceladas não podem ser editadas livremente');
    if (data.name !== undefined) this.validateName(data.name);
    if (data.filters) this.validateFilters(data.filters);
    await this.prisma.$transaction(async (tx) => {
      await tx.campaign.update({ where: { id }, data: { name: data.name?.trim(), description: data.description === undefined ? undefined : data.description?.trim() || null, campaignType: data.campaignType, status: data.status, scheduledAt: data.scheduledAt === undefined ? undefined : data.scheduledAt ? new Date(data.scheduledAt) : null } });
      if (data.filters) { await tx.campaignFilter.deleteMany({ where: { campaignId: id } }); if (data.filters.length) await tx.campaignFilter.createMany({ data: this.mapFilters(data.filters).map((f) => ({ ...f, campaignId: id })) }); }
    });
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) { await this.getCampaign(userId, id); await this.prisma.campaign.update({ where: { id }, data: { deletedAt: new Date() } }); return { success: true }; }
  async restore(userId: string, id: string) { const organizationId = await this.getOrganizationId(userId); const campaign = await this.prisma.campaign.findFirst({ where: { id, organizationId, deletedAt: { not: null } } }); if (!campaign) throw new NotFoundException('Campanha excluída não encontrada'); await this.prisma.campaign.update({ where: { id }, data: { deletedAt: null } }); return this.findOne(userId, id); }
  async archive(userId: string, id: string, archived: boolean) { await this.getCampaign(userId, id); await this.prisma.campaign.update({ where: { id }, data: { archivedAt: archived ? new Date() : null } }); return this.findOne(userId, id); }
  async cancel(userId: string, id: string) { const campaign = await this.getCampaign(userId, id); if (finalCampaignStatuses.includes(campaign.status as (typeof finalCampaignStatuses)[number])) throw new BadRequestException('Campanha não pode ser cancelada neste status'); await this.prisma.campaign.update({ where: { id }, data: { status: 'CANCELED', finishedAt: new Date() } }); return this.findOne(userId, id); }
  async estimate(userId: string, filters: CampaignFilterDto[] = []) { await this.getOrganizationId(userId); this.validateFilters(filters); return { estimatedContacts: Math.max(12, filters.length * 37) }; }

  private async getOrganizationId(userId: string) { const user = await this.prisma.user.findFirst({ where: { id: userId, active: true, deletedAt: null } }); if (!user?.organizationId) throw new ForbiddenException('Usuário sem organização ativa'); return user.organizationId; }
  private async getCampaign(userId: string, id: string, withDeleted = false) { const organizationId = await this.getOrganizationId(userId); const campaign = await this.prisma.campaign.findFirst({ where: { id, organizationId, ...(withDeleted ? {} : { deletedAt: null }) }, include: campaignInclude }); if (!campaign) throw new NotFoundException('Campanha não encontrada'); return campaign; }
  private validateName(name?: string) { if (!name?.trim()) throw new BadRequestException('Nome da campanha é obrigatório'); }
  private validateFilters(filters: CampaignFilterDto[]) { for (const filter of filters) { if (!fieldMap[filter.field] || !operatorMap[filter.operator]) throw new BadRequestException('Filtro de campanha inválido'); if (filter.value === undefined || filter.value === null || filter.value === '') throw new BadRequestException('Valor do filtro é obrigatório'); } }
  private mapFilters(filters: CampaignFilterDto[]) { return filters.map((filter) => ({ field: fieldMap[filter.field], operator: operatorMap[filter.operator], value: filter.value as Prisma.InputJsonValue })); }
}
