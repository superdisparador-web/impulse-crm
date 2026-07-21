import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { LeadHistoryAction, LeadStatus, LeadTemperature, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { ListLeadsDto } from './dto/list-leads.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

const safeUserSelect = { id: true, name: true, email: true, phone: true, role: true, active: true } satisfies Prisma.UserSelect;
const leadSelect = {
  id: true,
  name: true,
  phone: true,
  normalizedPhone: true,
  email: true,
  document: true,
  source: true,
  status: true,
  temperature: true,
  notes: true,
  assignedUserId: true,
  pipelineId: true,
  stageId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  assignedUser: { select: safeUserSelect },
  pipeline: { select: { id: true, name: true, active: true } },
  stage: { select: { id: true, name: true, order: true, color: true, active: true, pipelineId: true } },
} satisfies Prisma.LeadSelect;
const leadDetailSelect = {
  ...leadSelect,
  history: { orderBy: { createdAt: 'desc' as const }, include: { performedByUser: { select: safeUserSelect } } },
} satisfies Prisma.LeadSelect;

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  normalizePhone(phone: string) { return phone.replace(/\D/g, ''); }
  normalizeEmail(email?: string | null) { return email?.trim().toLowerCase() || null; }

  async findAll(organizationId: string, query: ListLeadsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.LeadWhereInput = {
      organizationId,
      deletedAt: null,
      ...(query.search ? { OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { normalizedPhone: { contains: this.normalizePhone(query.search) } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ] } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.temperature ? { temperature: query.temperature } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(query.assignedUserId ? { assignedUserId: query.assignedUserId } : {}),
      ...(query.pipelineId ? { pipelineId: query.pipelineId } : {}),
      ...(query.stageId ? { stageId: query.stageId } : {}),
      ...(query.assigned !== undefined ? { assignedUserId: query.assigned ? { not: null } : null } : {}),
      ...(query.createdFrom || query.createdTo ? { createdAt: { ...(query.createdFrom ? { gte: new Date(query.createdFrom) } : {}), ...(query.createdTo ? { lte: new Date(query.createdTo) } : {}) } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({ where, select: leadSelect, orderBy: { createdAt: query.order ?? 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.lead.count({ where }),
    ]);
    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(organizationId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id, organizationId, deletedAt: null }, select: leadDetailSelect });
    if (!lead) throw new NotFoundException('Lead não encontrado');
    return lead;
  }

  async create(organizationId: string, data: CreateLeadDto, performedByUserId?: string) {
    const normalizedPhone = this.normalizePhone(data.phone);
    if (!normalizedPhone) throw new BadRequestException('Telefone inválido');
    await this.ensureOrganization(organizationId);
    await this.ensureAssignedUser(organizationId, data.assignedUserId ?? null);
    await this.ensurePipelineStage(organizationId, data.pipelineId ?? null, data.stageId ?? null);
    await this.ensurePhoneAvailable(organizationId, normalizedPhone);
    const lead = await this.prisma.lead.create({
      data: { ...data, organizationId, email: this.normalizeEmail(data.email), normalizedPhone, source: data.source ?? 'MANUAL', status: data.status ?? 'NEW', temperature: data.temperature ?? 'COLD' },
      select: { id: true, name: true },
    });
    await this.addHistory(lead.id, 'CREATED', 'Lead criado', performedByUserId, { name: lead.name });
    return this.findOne(organizationId, lead.id);
  }

  async update(organizationId: string, id: string, data: UpdateLeadDto, performedByUserId?: string) {
    const current = await this.getLeadForMutation(organizationId, id);
    await this.ensureOrganization(organizationId);
    await this.ensureAssignedUser(organizationId, data.assignedUserId === undefined ? current.assignedUserId : data.assignedUserId);
    await this.ensurePipelineStage(organizationId, data.pipelineId === undefined ? current.pipelineId : data.pipelineId, data.stageId === undefined ? current.stageId : data.stageId);
    const normalizedPhone = data.phone !== undefined ? this.normalizePhone(data.phone) : current.normalizedPhone;
    if (!normalizedPhone) throw new BadRequestException('Telefone inválido');
    await this.ensurePhoneAvailable(organizationId, normalizedPhone, id);
    await this.prisma.lead.update({ where: { id }, data: { ...data, normalizedPhone, email: data.email === undefined ? undefined : this.normalizeEmail(data.email) } });
    await this.addHistory(id, 'UPDATED', 'Lead atualizado', performedByUserId, data as Prisma.InputJsonObject);
    return this.findOne(organizationId, id);
  }

  async assign(organizationId: string, id: string, assignedUserId: string | null, performedByUserId?: string) {
    await this.getLeadForMutation(organizationId, id);
    await this.ensureAssignedUser(organizationId, assignedUserId);
    await this.prisma.lead.update({ where: { id }, data: { assignedUserId } });
    await this.addHistory(id, assignedUserId ? 'ASSIGNED' : 'UNASSIGNED', assignedUserId ? 'Lead atribuído' : 'Atribuição removida', performedByUserId, { assignedUserId });
    return this.findOne(organizationId, id);
  }

  async updateStatus(organizationId: string, id: string, status: LeadStatus, performedByUserId?: string) {
    await this.getLeadForMutation(organizationId, id);
    await this.prisma.lead.update({ where: { id }, data: { status } });
    await this.addHistory(id, 'STATUS_CHANGED', 'Status alterado', performedByUserId, { status });
    return this.findOne(organizationId, id);
  }

  async updateTemperature(organizationId: string, id: string, temperature: LeadTemperature, performedByUserId?: string) {
    await this.getLeadForMutation(organizationId, id);
    await this.prisma.lead.update({ where: { id }, data: { temperature } });
    await this.addHistory(id, 'TEMPERATURE_CHANGED', 'Temperatura alterada', performedByUserId, { temperature });
    return this.findOne(organizationId, id);
  }

  async move(id: string, organizationId: string, stageId: string, performedByUserId?: string) {
    const lead = await this.getLeadForMutation(organizationId, id);
    const stage = await this.prisma.pipelineStage.findFirst({
      where: { id: stageId, active: true, deletedAt: null, pipeline: { active: true, deletedAt: null, organizationId } },
      select: { id: true, pipelineId: true },
    });
    if (!stage) throw new NotFoundException('Etapa ativa não encontrada para a organização do lead');

    await this.prisma.$transaction([
      this.prisma.lead.update({ where: { id }, data: { pipelineId: stage.pipelineId, stageId } }),
      this.prisma.pipelineHistory.create({ data: { leadId: id, pipelineId: stage.pipelineId, fromStageId: lead.stageId, toStageId: stageId, performedByUserId, metadata: { previousPipelineId: lead.pipelineId } } }),
      this.prisma.leadHistory.create({ data: { leadId: id, action: 'MOVED', description: 'Lead movido no pipeline', performedByUserId, metadata: { fromStageId: lead.stageId, toStageId: stageId, pipelineId: stage.pipelineId } } }),
    ]);
    return this.findOne(organizationId, id);
  }

  async remove(organizationId: string, id: string, performedByUserId?: string) {
    await this.getLeadForMutation(organizationId, id);
    await this.prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.addHistory(id, 'DELETED', 'Lead excluído', performedByUserId);
    return { success: true };
  }

  private async getLeadForMutation(organizationId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id, organizationId, deletedAt: null }, select: { id: true, organizationId: true, normalizedPhone: true, assignedUserId: true, pipelineId: true, stageId: true } });
    if (!lead) throw new NotFoundException('Lead não encontrado');
    return lead;
  }

  private async ensureOrganization(id: string) {
    const organization = await this.prisma.organization.findFirst({ where: { id, active: true, deletedAt: null }, select: { id: true } });
    if (!organization) throw new NotFoundException('Organização ativa não encontrada');
  }

  private async ensureAssignedUser(organizationId: string, assignedUserId?: string | null) {
    if (!assignedUserId) return;
    const user = await this.prisma.user.findFirst({ where: { id: assignedUserId, active: true, deletedAt: null }, select: { organizationId: true } });
    if (!user) throw new NotFoundException('Usuário responsável ativo não encontrado');
    if (user.organizationId && user.organizationId !== organizationId) throw new BadRequestException('Responsável deve pertencer à mesma organização do lead');
  }

  private async ensurePipelineStage(organizationId: string, pipelineId?: string | null, stageId?: string | null) {
    if (!pipelineId && !stageId) return;
    if (stageId) {
      const stage = await this.prisma.pipelineStage.findFirst({ where: { id: stageId, active: true, deletedAt: null, pipeline: { active: true, deletedAt: null, organizationId } }, select: { pipelineId: true } });
      if (!stage) throw new NotFoundException('Etapa ativa não encontrada para esta organização');
      if (pipelineId && stage.pipelineId !== pipelineId) throw new BadRequestException('Etapa não pertence ao pipeline informado');
      return;
    }
    const pipeline = await this.prisma.pipeline.findFirst({ where: { id: pipelineId ?? undefined, organizationId, active: true, deletedAt: null }, select: { id: true } });
    if (!pipeline) throw new NotFoundException('Pipeline ativo não encontrado para esta organização');
  }

  private async ensurePhoneAvailable(organizationId: string, normalizedPhone: string, ignoreId?: string) {
    const existing = await this.prisma.lead.findFirst({ where: { organizationId, normalizedPhone, deletedAt: null, ...(ignoreId ? { id: { not: ignoreId } } : {}) }, select: { id: true } });
    if (existing) throw new ConflictException('Já existe um lead ativo com este telefone nesta organização');
  }

  private async addHistory(leadId: string, action: LeadHistoryAction, description: string, performedByUserId?: string, metadata?: Prisma.InputJsonValue) {
    return this.prisma.leadHistory.create({ data: { leadId, action, description, performedByUserId, metadata: metadata ?? Prisma.JsonNull } });
  }
}
