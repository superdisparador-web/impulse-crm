import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AnalyticsEventSource, Prisma } from '@prisma/client';
import { AnalyticsEventsService } from '../analytics/analytics-events.service';
import { AuditService } from '../audit/audit.service';
import { AccessContext, AccessContextService, AuthenticatedUserRef } from '../auth/access-context.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddCardDto, CreatePipelineDto, CreateStageDto, ListPipelinesDto, MoveCardDto, PipelineBoardQueryDto, ReorderStagesDto, UpdatePipelineDto, UpdateStageDto } from './dto/pipeline.dto';

type UserRef = AuthenticatedUserRef;
type Tx = Prisma.TransactionClient;

const DEFAULT_PIPELINE_NAME = 'Pipeline de Vendas';
const DEFAULT_STAGE_NAMES = ['Novo', 'Primeiro contato', 'Interessado', 'Agendamento', 'Visita', 'Documentação', 'Análise bancária', 'Aprovação', 'Reserva', 'Contrato', 'Venda', 'Perdido'];
const LEGACY_STAGE_ALIASES: Record<string, string[]> = {
  'novo': ['novo lead'],
  'primeiro contato': ['em atendimento'],
  'agendamento': ['visita agendada'],
  'analise bancaria': ['analise de credito'],
};
const leadSelect = { id: true, name: true, phone: true, email: true, source: true, status: true, temperature: true, metadata: true, createdAt: true, updatedAt: true, assignedUserId: true, managerUserId: true, assignedUser: { select: { id: true, name: true } }, managerUser: { select: { id: true, name: true } }, leadDistributions: { where: { slaDueAt: { not: null } }, orderBy: { createdAt: 'desc' as const }, take: 1, select: { slaDueAt: true, firstUpdatedAt: true } } } satisfies Prisma.LeadSelect;

@Injectable()
export class PipelineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessContextService,
    private readonly audit: AuditService,
    private readonly analyticsEvents: AnalyticsEventsService,
  ) {}

  private scope(ctx: AccessContext, requested?: string) { if (!ctx.global) return ctx.organizationId!; if (!requested) throw new BadRequestException('Organização é obrigatória'); return requested; }
  private whereScope(ctx: AccessContext, requested?: string) { return ctx.global && requested ? { organizationId: requested } : ctx.global ? {} : { organizationId: ctx.organizationId! }; }
  private cleanName(name: string | undefined) { const value = name?.trim(); if (!value) throw new BadRequestException('Nome é obrigatório'); return value; }
  private async org(id: string) { const organization = await this.prisma.organization.findFirst({ where: { id, active: true, deletedAt: null } }); if (!organization) throw new NotFoundException('Organização ativa não encontrada'); return organization; }
  private async pipelineForUser(id: string, user: UserRef) { const ctx = await this.access.resolve(user); const pipeline = await this.prisma.pipeline.findFirst({ where: { id, deletedAt: null, ...this.whereScope(ctx) }, include: { stages: { where: { deletedAt: null }, orderBy: { position: 'asc' } } } }); if (!pipeline) throw new NotFoundException('Pipeline não encontrado'); return pipeline; }
  private async stageInPipeline(stageId: string, pipelineId: string, organizationId: string) { const stage = await this.prisma.pipelineStage.findFirst({ where: { id: stageId, pipelineId, organizationId, deletedAt: null } }); if (!stage) throw new NotFoundException('Etapa não encontrada no pipeline'); return stage; }
  private async activeStageInPipeline(stageId: string, pipelineId: string, organizationId: string) { const stage = await this.prisma.pipelineStage.findFirst({ where: { id: stageId, pipelineId, organizationId, deletedAt: null, active: true } }); if (!stage) throw new NotFoundException('Etapa ativa não encontrada no pipeline'); return stage; }
  private async leadInOrg(leadId: string, organizationId: string) { const lead = await this.prisma.lead.findFirst({ where: { id: leadId, organizationId, deletedAt: null }, select: leadSelect }); if (!lead) throw new NotFoundException('Lead não encontrado na organização'); return lead; }
  private async assertUniquePipelineName(organizationId: string, name: string, ignoreId?: string) { const duplicate = await this.prisma.pipeline.findFirst({ where: { organizationId, name, deletedAt: null, ...(ignoreId ? { id: { not: ignoreId } } : {}) } }); if (duplicate) throw new ConflictException('Já existe pipeline ativo com este nome na organização'); }

  async ensureDefaultPipeline(organizationId: string, actorUserId?: string) {
    await this.org(organizationId);
    const existing = await this.prisma.pipeline.findFirst({ where: { organizationId, deletedAt: null, active: true }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] });
    if (existing) { await this.synchronizeDefaultStages(existing.id, organizationId); return existing; }
    const pipeline = await this.prisma.$transaction(async tx => {
      const again = await tx.pipeline.findFirst({ where: { organizationId, deletedAt: null, active: true } });
      if (again) return again;
      const created = await tx.pipeline.create({ data: { organizationId, name: DEFAULT_PIPELINE_NAME, isDefault: true, active: true, createdByUserId: actorUserId } });
      await tx.pipelineStage.createMany({ data: DEFAULT_STAGE_NAMES.map((name, index) => ({ organizationId, pipelineId: created.id, name, position: index + 1, isInitial: index === 0, active: true })) });
      return created;
    });
    await this.audit.record({ organizationId, actorUserId, module: 'pipeline', entityType: 'Pipeline', entityId: pipeline.id, action: 'pipeline.default_ensured', after: pipeline as Prisma.InputJsonValue });
    return pipeline;
  }

  private async synchronizeDefaultStages(pipelineId: string, organizationId: string) {
    await this.prisma.$transaction(async tx => {
      const stages = await tx.pipelineStage.findMany({ where: { organizationId, pipelineId, deletedAt: null }, orderBy: { position: 'asc' } });
      const existingNames = new Set(stages.map(stage => this.normalize(stage.name)));
      const missing = DEFAULT_STAGE_NAMES.filter(name => {
        const canonical = this.normalize(name);
        return !existingNames.has(canonical) && !(LEGACY_STAGE_ALIASES[canonical] ?? []).some(alias => existingNames.has(alias));
      });
      if (!missing.length) return;
      const lastPosition = stages.reduce((maximum, stage) => Math.max(maximum, stage.position), 0);
      await tx.pipelineStage.createMany({ data: missing.map((name, index) => ({ organizationId, pipelineId, name, position: lastPosition + index + 1, active: true })) });
    });
  }

  async createPipeline(data: CreatePipelineDto, user: UserRef) {
    const ctx = await this.access.resolve(user); const organizationId = this.scope(ctx, data.organizationId); await this.org(organizationId); const name = this.cleanName(data.name); await this.assertUniquePipelineName(organizationId, name);
    const pipeline = await this.prisma.$transaction(async tx => { if (data.isDefault) await tx.pipeline.updateMany({ where: { organizationId, isDefault: true, deletedAt: null }, data: { isDefault: false } }); return tx.pipeline.create({ data: { organizationId, name, description: data.description, isDefault: !!data.isDefault, active: data.isActive ?? true, createdByUserId: user.id } }); });
    await this.audit.record({ organizationId, actorUserId: user.id, module: 'pipeline', entityType: 'Pipeline', entityId: pipeline.id, action: 'pipeline.created', after: pipeline as Prisma.InputJsonValue });
    return pipeline;
  }

  async listPipelines(query: ListPipelinesDto, user: UserRef) { const ctx = await this.access.resolve(user); return this.prisma.pipeline.findMany({ where: { deletedAt: null, ...this.whereScope(ctx, query.organizationId) }, include: { stages: { where: { deletedAt: null }, orderBy: { position: 'asc' } } }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] }); }
  async getPipeline(id: string, user: UserRef) { return this.pipelineForUser(id, user); }

  async updatePipeline(id: string, data: UpdatePipelineDto, user: UserRef) {
    const current = await this.pipelineForUser(id, user); const name = data.name === undefined ? undefined : this.cleanName(data.name); if (name) await this.assertUniquePipelineName(current.organizationId, name, id);
    const updated = await this.prisma.pipeline.update({ where: { id }, data: { name, description: data.description, active: data.isActive } });
    await this.audit.record({ organizationId: current.organizationId, actorUserId: user.id, module: 'pipeline', entityType: 'Pipeline', entityId: id, action: 'pipeline.updated', before: current as Prisma.InputJsonValue, after: updated as Prisma.InputJsonValue });
    return updated;
  }

  async deletePipeline(id: string, user: UserRef) {
    const current = await this.pipelineForUser(id, user); const updated = await this.prisma.pipeline.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
    await this.audit.record({ organizationId: current.organizationId, actorUserId: user.id, module: 'pipeline', entityType: 'Pipeline', entityId: id, action: 'pipeline.archived', before: current as Prisma.InputJsonValue, after: updated as Prisma.InputJsonValue });
    return { success: true, id };
  }

  async listStages(pipelineId: string, user: UserRef) { const pipeline = await this.pipelineForUser(pipelineId, user); return this.prisma.pipelineStage.findMany({ where: { organizationId: pipeline.organizationId, pipelineId, deletedAt: null }, orderBy: { position: 'asc' } }); }
  async createStage(pipelineId: string, data: CreateStageDto, user: UserRef) { const pipeline = await this.pipelineForUser(pipelineId, user); const name = this.cleanName(data.name); const position = data.position ?? (await this.prisma.pipelineStage.count({ where: { organizationId: pipeline.organizationId, pipelineId, deletedAt: null } })) + 1; const stage = await this.prisma.pipelineStage.create({ data: { organizationId: pipeline.organizationId, pipelineId, name, description: data.description, position, color: data.color, active: data.isActive ?? true } }); await this.audit.record({ organizationId: pipeline.organizationId, actorUserId: user.id, module: 'pipeline', entityType: 'PipelineStage', entityId: stage.id, action: 'stage.created', after: stage as Prisma.InputJsonValue }); return stage; }
  async updateStage(pipelineId: string, stageId: string, data: UpdateStageDto, user: UserRef) { const pipeline = await this.pipelineForUser(pipelineId, user); const current = await this.stageInPipeline(stageId, pipelineId, pipeline.organizationId); const updated = await this.prisma.pipelineStage.update({ where: { id: stageId }, data: { name: data.name?.trim(), description: data.description, color: data.color, active: data.isActive } }); await this.audit.record({ organizationId: pipeline.organizationId, actorUserId: user.id, module: 'pipeline', entityType: 'PipelineStage', entityId: stageId, action: 'stage.updated', before: current as Prisma.InputJsonValue, after: updated as Prisma.InputJsonValue }); return updated; }
  async deleteStage(pipelineId: string, stageId: string, user: UserRef) { const pipeline = await this.pipelineForUser(pipelineId, user); const stage = await this.stageInPipeline(stageId, pipelineId, pipeline.organizationId); const cards = await this.prisma.pipelineLead.count({ where: { organizationId: pipeline.organizationId, pipelineId, stageId, deletedAt: null } }); if (cards) throw new ConflictException('A etapa possui cards. Mova os cards antes de excluir.'); const updated = await this.prisma.pipelineStage.update({ where: { id: stage.id }, data: { deletedAt: new Date(), active: false } }); await this.audit.record({ organizationId: pipeline.organizationId, actorUserId: user.id, module: 'pipeline', entityType: 'PipelineStage', entityId: stage.id, action: 'stage.archived', before: stage as Prisma.InputJsonValue, after: updated as Prisma.InputJsonValue }); return { success: true, id: stage.id }; }

  async reorderStages(pipelineId: string, data: ReorderStagesDto, user: UserRef) { const pipeline = await this.pipelineForUser(pipelineId, user); const ids = data.stages.map(stage => stage.id); if (new Set(ids).size !== ids.length) throw new ConflictException('IDs de etapas duplicados na reordenação'); const stages = await this.prisma.pipelineStage.findMany({ where: { id: { in: ids }, organizationId: pipeline.organizationId, pipelineId, deletedAt: null } }); if (stages.length !== ids.length) throw new ConflictException('Todas as etapas devem pertencer ao pipeline da organização'); const reordered = await this.prisma.$transaction(async tx => { for (const item of data.stages) await tx.pipelineStage.update({ where: { id: item.id }, data: { position: item.position } }); return tx.pipelineStage.findMany({ where: { organizationId: pipeline.organizationId, pipelineId, deletedAt: null }, orderBy: { position: 'asc' } }); }); await this.audit.record({ organizationId: pipeline.organizationId, actorUserId: user.id, module: 'pipeline', entityType: 'Pipeline', entityId: pipelineId, action: 'stage.reordered', before: stages as Prisma.InputJsonValue, after: reordered as Prisma.InputJsonValue }); return reordered; }

  async addCard(pipelineId: string, data: AddCardDto, user: UserRef) { const pipeline = await this.pipelineForUser(pipelineId, user); await this.activeStageInPipeline(data.stageId, pipelineId, pipeline.organizationId); const lead = await this.leadInOrg(data.leadId, pipeline.organizationId); const duplicate = await this.prisma.pipelineLead.findFirst({ where: { organizationId: pipeline.organizationId, pipelineId, leadId: data.leadId, deletedAt: null } }); if (duplicate) throw new ConflictException('Lead já está neste pipeline'); const position = await this.prisma.pipelineLead.count({ where: { organizationId: pipeline.organizationId, pipelineId, stageId: data.stageId, deletedAt: null } }) + 1; const card = await this.prisma.pipelineLead.create({ data: { organizationId: pipeline.organizationId, pipelineId, stageId: data.stageId, leadId: lead.id, position } }); await this.audit.record({ organizationId: pipeline.organizationId, actorUserId: user.id, module: 'pipeline', entityType: 'PipelineLead', entityId: card.id, action: 'pipeline.lead_added', after: card as Prisma.InputJsonValue }); return card; }
  async listCards(pipelineId: string, user: UserRef) { const pipeline = await this.pipelineForUser(pipelineId, user); return this.prisma.pipelineLead.findMany({ where: { organizationId: pipeline.organizationId, pipelineId, deletedAt: null }, include: { lead: { select: leadSelect } }, orderBy: [{ stageId: 'asc' }, { position: 'asc' }] }); }
  async board(pipelineId: string, user: UserRef, query: PipelineBoardQueryDto = {}) {
    const pipeline = await this.pipelineForUser(pipelineId, user);
    const ctx = await this.access.resolve(user);
    const role = String(ctx.role ?? user.role ?? '');
    const leadWhere: Prisma.LeadWhereInput = { deletedAt: null, archivedAt: null };
    if (role === 'BROKER' || role === 'CORRETOR') leadWhere.assignedUserId = ctx.id ?? user.id;
    else if (role === 'MANAGER') leadWhere.managerUserId = ctx.id ?? user.id;
    if (query.brokerId) leadWhere.assignedUserId = query.brokerId;
    if (query.managerId) leadWhere.managerUserId = query.managerId;
    if (query.status) leadWhere.status = query.status;
    if (query.temperature) leadWhere.temperature = query.temperature;
    if (query.source) leadWhere.source = query.source;
    if (query.from || query.to) leadWhere.updatedAt = { gte: query.from ? new Date(query.from) : undefined, lte: query.to ? new Date(query.to) : undefined };
    if (query.search) leadWhere.OR = [{ name: { contains: query.search, mode: 'insensitive' } }, { email: { contains: query.search, mode: 'insensitive' } }, { phone: { contains: query.search } }];
    const stages = await this.prisma.pipelineStage.findMany({ where: { organizationId: pipeline.organizationId, pipelineId, active: true, deletedAt: null }, orderBy: { position: 'asc' }, include: { cards: { where: { deletedAt: null, lead: leadWhere }, orderBy: { position: 'asc' }, include: { lead: { select: leadSelect } } } } });
    const now = Date.now();
    const limit = query.limit ?? 50;
    const mapped = stages.map(({ cards, ...stage }) => {
      const eligible = cards.filter(card => this.matchesPropertyFilters(card.lead, query)).filter(card => {
        const sla = card.lead.leadDistributions?.[0];
        const overdue = Boolean(sla?.slaDueAt && !sla.firstUpdatedAt && sla.slaDueAt.getTime() < now);
        return !query.sla || query.sla === 'ALL' || (query.sla === 'OVERDUE' ? overdue : !overdue);
      });
      return { id: stage.id, name: stage.name, position: stage.position, color: stage.color, total: eligible.length, overdueSla: eligible.filter(card => this.publicLead(card.lead).sla?.status === 'OVERDUE').length, totalStageMs: eligible.reduce((sum, card) => sum + Math.max(0, now - card.enteredStageAt.getTime()), 0), cards: eligible.slice(0, limit).map(card => ({ id: card.id, position: card.position, enteredStageAt: card.enteredStageAt, updatedAt: card.updatedAt, lead: this.publicLead(card.lead) })) };
    });
    const allCards = mapped.flatMap(stage => stage.cards);
    const total = mapped.reduce((sum, stage) => sum + stage.total, 0);
    const sold = mapped.find(stage => this.normalize(stage.name) === 'venda')?.total ?? 0;
    const overdueSla = mapped.reduce((sum, stage) => sum + stage.overdueSla, 0);
    const averageStageHours = total ? Math.round(mapped.reduce((sum, stage) => sum + stage.totalStageMs, 0) / total / 3600000) : 0;
    return { id: pipeline.id, name: pipeline.name, stages: mapped, metrics: { total, byStage: Object.fromEntries(mapped.map(stage => [stage.name, stage.total])), conversionRate: total ? Number(((sold / total) * 100).toFixed(1)) : 0, averageStageHours, overdueSla }, pagination: { limit, returned: allCards.length, total } };
  }

  async moveCard(cardId: string, data: MoveCardDto, user: UserRef) {
    if (data.position < 0) throw new BadRequestException('Posição não pode ser negativa'); const ctx = await this.access.resolve(user); const card = await this.prisma.pipelineLead.findFirst({ where: { id: cardId, deletedAt: null, ...this.whereScope(ctx) }, include: { lead: { select: leadSelect } } }); if (!card) throw new NotFoundException('Card não encontrado'); const destination = await this.activeStageInPipeline(data.stageId, card.pipelineId, card.organizationId);
    const role = String(ctx.role ?? user.role ?? '');
    if ((role === 'BROKER' || role === 'CORRETOR') && card.lead.assignedUserId !== (ctx.id ?? user.id)) throw new ForbiddenException('O corretor só pode movimentar os próprios leads');
    if (role === 'MANAGER' && card.lead.managerUserId !== (ctx.id ?? user.id)) throw new ForbiddenException('O gerente só pode movimentar leads da própria equipe');
    const result = await this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${card.id}))`;
      const locked = await tx.pipelineLead.findUnique({ where: { id: card.id } });
      if (!locked || locked.deletedAt) throw new NotFoundException('Card não encontrado');
      const fromStageId = locked.stageId;
      await tx.pipelineLead.update({ where: { id: card.id }, data: { position: -1 } });
      await this.normalizeCardPositions(tx, card.organizationId, card.pipelineId, fromStageId);
      const count = await tx.pipelineLead.count({ where: { organizationId: card.organizationId, pipelineId: card.pipelineId, stageId: destination.id, deletedAt: null } });
      const position = Math.min(data.position || 1, count + 1);
      await tx.pipelineLead.updateMany({ where: { organizationId: card.organizationId, pipelineId: card.pipelineId, stageId: destination.id, deletedAt: null, position: { gte: position } }, data: { position: { increment: 1 } } });
      const moved = await tx.pipelineLead.update({ where: { id: card.id }, data: { stageId: destination.id, position, enteredStageAt: destination.id === fromStageId ? locked.enteredStageAt : new Date() } });
      await this.normalizeCardPositions(tx, card.organizationId, card.pipelineId, fromStageId);
      await this.normalizeCardPositions(tx, card.organizationId, card.pipelineId, destination.id);
      if (destination.id !== fromStageId) await tx.leadEvent.create({ data: { organizationId: card.organizationId, leadId: card.leadId, eventType: 'LEAD_STATUS_CHANGED', description: `Lead movido para ${destination.name}`, actorUserId: user.id, occurredAt: moved.enteredStageAt, payload: { pipelineId: card.pipelineId, fromStageId, toStageId: destination.id, reason: data.reason } } });
      return { moved, fromStageId };
    });
    const updated = result.moved;
    await this.audit.record({ organizationId: card.organizationId, actorUserId: user.id, module: 'pipeline', entityType: 'PipelineLead', entityId: card.id, action: 'pipeline.card_moved', before: card as Prisma.InputJsonValue, after: updated as Prisma.InputJsonValue });
    if (destination.id !== result.fromStageId) await this.analyticsEvents.emit({ organizationId: card.organizationId, source: AnalyticsEventSource.LEADS, eventType: 'LEAD_STAGE_CHANGED', occurredAt: updated.enteredStageAt, idempotencyKey: `pipeline-stage-changed:${card.id}:${updated.enteredStageAt.toISOString()}`, leadId: card.leadId, brokerUserId: card.lead.assignedUserId, managerUserId: card.lead.managerUserId, metadata: { pipelineId: card.pipelineId, fromStageId: result.fromStageId, toStageId: destination.id } });
    return updated;
  }

  async removeCard(cardId: string, user: UserRef) { const ctx = await this.access.resolve(user); const card = await this.prisma.pipelineLead.findFirst({ where: { id: cardId, deletedAt: null, ...this.whereScope(ctx) } }); if (!card) throw new NotFoundException('Card não encontrado'); const updated = await this.prisma.$transaction(async tx => { const removed = await tx.pipelineLead.update({ where: { id: card.id }, data: { deletedAt: new Date() } }); await this.normalizeCardPositions(tx, card.organizationId, card.pipelineId, card.stageId); return removed; }); await this.audit.record({ organizationId: card.organizationId, actorUserId: user.id, module: 'pipeline', entityType: 'PipelineLead', entityId: card.id, action: 'pipeline.card_removed', before: card as Prisma.InputJsonValue, after: updated as Prisma.InputJsonValue }); return { success: true, id: card.id }; }

  private async normalizeCardPositions(tx: Tx, organizationId: string, pipelineId: string, stageId: string) { const cards = await tx.pipelineLead.findMany({ where: { organizationId, pipelineId, stageId, deletedAt: null }, orderBy: [{ position: 'asc' }, { updatedAt: 'asc' }] }); for (let index = 0; index < cards.length; index++) if (cards[index].position !== index + 1) await tx.pipelineLead.update({ where: { id: cards[index].id }, data: { position: index + 1 } }); }
  private normalize(value: unknown) { return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
  private metadata(lead: Prisma.LeadGetPayload<{ select: typeof leadSelect }>) { return lead.metadata && typeof lead.metadata === 'object' && !Array.isArray(lead.metadata) ? lead.metadata as Record<string, unknown> : {}; }
  private matchesPropertyFilters(lead: Prisma.LeadGetPayload<{ select: typeof leadSelect }>, query: PipelineBoardQueryDto) { const data = this.metadata(lead); const includes = (filter: string | undefined, ...values: unknown[]) => !filter || values.some(value => this.normalize(value).includes(this.normalize(filter))); return includes(query.development, data.development, data.empreendimento) && includes(query.region, data.region, data.regiao) && includes(query.neighborhood, data.neighborhood, data.bairro); }
  private publicLead(lead: Prisma.LeadGetPayload<{ select: typeof leadSelect }>) { const { assignedUserId, managerUserId, leadDistributions, metadata, ...safeLead } = lead; const data = this.metadata(lead); const distribution = leadDistributions?.[0]; const overdue = Boolean(distribution?.slaDueAt && !distribution.firstUpdatedAt && distribution.slaDueAt.getTime() < Date.now()); return { ...safeLead, development: data.development ?? data.empreendimento ?? null, region: data.region ?? data.regiao ?? null, neighborhood: data.neighborhood ?? data.bairro ?? null, sla: distribution?.slaDueAt ? { dueAt: distribution.slaDueAt, status: distribution.firstUpdatedAt ? 'ATTENDED' : overdue ? 'OVERDUE' : 'ON_TIME' } : null }; }
}
