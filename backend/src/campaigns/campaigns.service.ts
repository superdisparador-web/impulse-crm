import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CampaignRecipientStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddRecipientsDto } from './dto/add-recipients.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { ListCampaignsDto } from './dto/list-campaigns.dto';
import { ScheduleCampaignDto } from './dto/schedule-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

const finalCampaignStatuses = ['COMPLETED', 'CANCELED'] as const;

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  active: true,
  organizationId: true,
} satisfies Prisma.UserSelect;

const safeAccountSelect = {
  id: true,
  organizationId: true,
  name: true,
  phoneNumber: true,
  phoneNumberId: true,
  businessAccountId: true,
  status: true,
  connectedAt: true,
  lastSyncAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.WhatsappAccountSelect;

const campaignInclude = {
  whatsappAccount: { select: safeAccountSelect },
  whatsappTemplate: true,
  createdBy: { select: safeUserSelect },
  _count: { select: { recipients: true } },
} satisfies Prisma.CampaignInclude;

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: ListCampaignsDto) {
    const organizationId = await this.getOrganizationId(userId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.CampaignWhereInput = {
      organizationId,
      deletedAt: null,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.whatsappAccountId
        ? { whatsappAccountId: query.whatsappAccountId }
        : {}),
      ...(query.whatsappTemplateId
        ? { whatsappTemplateId: query.whatsappTemplateId }
        : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.campaign.findMany({
        where,
        include: campaignInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(userId: string, id: string) {
    return this.getCampaign(userId, id, true);
  }

  async create(userId: string, data: CreateCampaignDto) {
    const organizationId = await this.getOrganizationId(userId);

    if (!data.name?.trim()) {
      throw new BadRequestException('Nome da campanha é obrigatório');
    }

    await this.validateWhatsapp(
      organizationId,
      data.whatsappAccountId,
      data.whatsappTemplateId,
    );

    return this.prisma.campaign.create({
      data: {
        organizationId,
        createdById: userId,
        name: data.name.trim(),
        description: data.description,
        status: 'DRAFT',
        whatsappAccountId: data.whatsappAccountId,
        whatsappTemplateId: data.whatsappTemplateId,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      },
      include: campaignInclude,
    });
  }

  async update(userId: string, id: string, data: UpdateCampaignDto) {
    const current = await this.getCampaign(userId, id);

    if (finalCampaignStatuses.includes(current.status as (typeof finalCampaignStatuses)[number])) {
      throw new BadRequestException(
        'Campanhas concluídas ou canceladas não podem ser editadas livremente',
      );
    }

    await this.validateWhatsapp(
      current.organizationId,
      data.whatsappAccountId === undefined
        ? current.whatsappAccountId
        : data.whatsappAccountId,
      data.whatsappTemplateId === undefined
        ? current.whatsappTemplateId
        : data.whatsappTemplateId,
    );

    await this.prisma.campaign.update({
      where: { id },
      data: {
        ...data,
        name: data.name?.trim(),
        scheduledAt:
          data.scheduledAt === undefined
            ? undefined
            : data.scheduledAt
              ? new Date(data.scheduledAt)
              : null,
      },
    });

    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.getCampaign(userId, id);
    await this.prisma.campaign.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  async addRecipients(userId: string, id: string, data: AddRecipientsDto) {
    const campaign = await this.getCampaign(userId, id);

    if (campaign.status !== 'DRAFT') {
      throw new BadRequestException(
        'Destinatários só podem ser alterados em rascunho',
      );
    }

    if (!this.hasRecipientSelection(data)) {
      throw new BadRequestException('Informe leads ou filtros');
    }

    const leads = await this.prisma.lead.findMany({
      where: this.buildLeadWhere(campaign.organizationId, data),
      take: 1000,
    });
    const leadIds = leads.map((lead) => lead.id);
    const existing = leadIds.length
      ? await this.prisma.campaignRecipient.findMany({
          where: { campaignId: id, leadId: { in: leadIds } },
          select: { leadId: true },
        })
      : [];
    const used = new Set(existing.map((recipient) => recipient.leadId));
    const recipients = leads
      .filter((lead) => lead.normalizedPhone && !used.has(lead.id))
      .map((lead) => ({
        campaignId: id,
        leadId: lead.id,
        phone: lead.normalizedPhone,
        name: lead.name,
        assignedUserId: lead.assignedUserId,
      }));

    if (recipients.length) {
      await this.prisma.campaignRecipient.createMany({
        data: recipients,
        skipDuplicates: true,
      });
    }

    const totals = await this.recount(id);

    return {
      added: recipients.length,
      duplicated: existing.length,
      ignoredWithoutPhone: leads.filter((lead) => !lead.normalizedPhone).length,
      totalContacts: totals.totalContacts,
    };
  }

  async removeRecipient(userId: string, id: string, recipientId: string) {
    const campaign = await this.getCampaign(userId, id);

    if (campaign.status !== 'DRAFT') {
      throw new BadRequestException('Remoção permitida apenas em rascunho');
    }

    const recipient = await this.prisma.campaignRecipient.findFirst({
      where: { id: recipientId, campaignId: id },
    });

    if (!recipient) {
      throw new NotFoundException('Destinatário não encontrado');
    }

    await this.prisma.campaignRecipient.delete({ where: { id: recipientId } });
    await this.recount(id);
    return { success: true };
  }

  async schedule(userId: string, id: string, data: ScheduleCampaignDto) {
    const campaign = await this.getCampaign(userId, id);
    const scheduledAt = new Date(data.scheduledAt);

    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Data inválida');
    }

    if (!campaign.whatsappAccountId || !campaign.whatsappTemplateId) {
      throw new BadRequestException('Conta e template são obrigatórios');
    }

    const totalRecipients = await this.prisma.campaignRecipient.count({
      where: { campaignId: id },
    });

    if (totalRecipients < 1) {
      throw new BadRequestException('Adicione ao menos um destinatário');
    }

    await this.prisma.campaign.update({
      where: { id },
      data: { status: 'SCHEDULED', scheduledAt },
    });
    return this.findOne(userId, id);
  }

  async cancel(userId: string, id: string) {
    const campaign = await this.getCampaign(userId, id);

    if (finalCampaignStatuses.includes(campaign.status as (typeof finalCampaignStatuses)[number])) {
      throw new BadRequestException('Campanha não pode ser cancelada neste status');
    }

    await this.prisma.campaign.update({
      where: { id },
      data: { status: 'CANCELED', finishedAt: new Date() },
    });
    return this.findOne(userId, id);
  }

  async duplicate(userId: string, id: string) {
    const campaign = await this.getCampaign(userId, id, true);
    const created = await this.prisma.campaign.create({
      data: {
        organizationId: campaign.organizationId,
        createdById: userId,
        name: `${campaign.name} (cópia)`,
        description: campaign.description,
        status: 'DRAFT',
        whatsappAccountId: campaign.whatsappAccountId,
        whatsappTemplateId: campaign.whatsappTemplateId,
      },
    });
    const recipients = (campaign.recipients ?? []).map((recipient) => ({
      campaignId: created.id,
      leadId: recipient.leadId,
      phone: recipient.phone,
      name: recipient.name,
      assignedUserId: recipient.assignedUserId,
    }));

    if (recipients.length) {
      await this.prisma.campaignRecipient.createMany({ data: recipients });
    }

    await this.recount(created.id);
    return this.findOne(userId, created.id);
  }

  private async getOrganizationId(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, active: true, deletedAt: null },
    });

    if (!user?.organizationId) {
      throw new ForbiddenException('Usuário sem organização ativa');
    }

    return user.organizationId;
  }

  private async validateWhatsapp(
    organizationId: string,
    accountId?: string | null,
    templateId?: string | null,
  ) {
    if (
      accountId &&
      !(await this.prisma.whatsappAccount.findFirst({
        where: { id: accountId, organizationId, deletedAt: null },
      }))
    ) {
      throw new BadRequestException(
        'Conta WhatsApp não pertence à organização',
      );
    }

    if (
      templateId &&
      !(await this.prisma.whatsappTemplate.findFirst({
        where: { id: templateId, organizationId },
      }))
    ) {
      throw new BadRequestException(
        'Template WhatsApp não pertence à organização',
      );
    }
  }

  private async getCampaign(userId: string, id: string, withRecipients = false) {
    const organizationId = await this.getOrganizationId(userId);
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        ...campaignInclude,
        ...(withRecipients
          ? {
              recipients: {
                include: {
                  lead: true,
                  assignedUser: { select: safeUserSelect },
                },
                orderBy: { createdAt: 'desc' },
              },
            }
          : {}),
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada');
    }

    return campaign;
  }

  private buildLeadWhere(
    organizationId: string,
    data: AddRecipientsDto,
  ): Prisma.LeadWhereInput {
    return {
      organizationId,
      deletedAt: null,
      ...(data.leadIds?.length ? { id: { in: data.leadIds } } : {}),
      ...(data.search
        ? {
            OR: [
              { name: { contains: data.search, mode: 'insensitive' } },
              { phone: { contains: data.search } },
              { email: { contains: data.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.source ? { source: data.source } : {}),
      ...(data.temperature ? { temperature: data.temperature } : {}),
      ...(data.assignedUserId ? { assignedUserId: data.assignedUserId } : {}),
    };
  }

  private hasRecipientSelection(data: AddRecipientsDto) {
    return Boolean(
      data.leadIds?.length ||
        data.search ||
        data.status ||
        data.source ||
        data.temperature ||
        data.assignedUserId,
    );
  }

  private async recount(id: string) {
    const grouped = await this.prisma.campaignRecipient.groupBy({
      by: ['status'],
      where: { campaignId: id },
      _count: { _all: true },
    });
    const countByStatus = new Map<CampaignRecipientStatus, number>(
      grouped.map((item) => [item.status, item._count._all]),
    );
    const totalContacts = grouped.reduce(
      (total, item) => total + item._count._all,
      0,
    );
    const data = {
      totalContacts,
      totalQueued: countByStatus.get('QUEUED') ?? 0,
      totalSent: countByStatus.get('SENT') ?? 0,
      totalDelivered: countByStatus.get('DELIVERED') ?? 0,
      totalRead: countByStatus.get('READ') ?? 0,
      totalFailed: countByStatus.get('FAILED') ?? 0,
      totalClicked: countByStatus.get('CLICKED') ?? 0,
    };

    await this.prisma.campaign.update({ where: { id }, data });
    return data;
  }
}
