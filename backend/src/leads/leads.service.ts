import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { LeadActivityStatus, LeadEventType, LeadHistoryAction, LeadStatus, LeadTemperature, Prisma, Role } from '@prisma/client';
import { AccessContext, AccessContextService, AuthenticatedUserRef } from '../auth/access-context.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { CreateLeadDto, LeadExternalIdentityDto } from './dto/create-lead.dto';
import { ListLeadActivitiesDto } from './dto/list-lead-activities.dto';
import { ListLeadsDto } from './dto/list-leads.dto';
import { UpdateLeadActivityDto } from './dto/update-lead-activity.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { AuditService } from '../audit/audit.service';
import { TimelineService } from './timeline.service';

const safeUserSelect = { id: true, name: true, email: true, phone: true, role: true, active: true, organizationId: true } satisfies Prisma.UserSelect;
const leadInclude = {
  organization: { select: { id: true, name: true, active: true } },
  assignedUser: { select: safeUserSelect },
  managerUser: { select: safeUserSelect },
  externalIdentities: true,
  _count: { select: { activities: true, events: true } },
} satisfies Prisma.LeadInclude;
const leadDetailInclude = {
  ...leadInclude,
  events: { orderBy: { occurredAt: 'desc' as const }, include: { actorUser: { select: safeUserSelect } } },
  activities: { orderBy: { dueAt: 'asc' as const }, include: { responsibleUser: { select: safeUserSelect }, createdByUser: { select: safeUserSelect } } },
} satisfies Prisma.LeadInclude;

type UserRef = AuthenticatedUserRef;
type LeadPayload = Omit<CreateLeadDto, 'externalIdentity' | 'externalIdentities'> & { normalizedPhone?: string | null; normalizedEmail?: string | null; createdByUserId?: string; lastContactAt?: Date | null };

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService, private readonly access: AccessContextService, private readonly timeline: TimelineService, private readonly audit?: AuditService) {}

  normalizePhone(phone?: string | null) {
    const digits = phone?.replace(/\D/g, '') || '';
    if (!digits) return null;
    if (digits.startsWith('55') && digits.length >= 12) return `+${digits}`;
    if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
    return `+${digits}`;
  }
  normalizeEmail(email?: string | null) { return email?.trim().toLowerCase() || null; }
  normalizeDocument(document?: string | null) { return document?.replace(/\D/g, '') || null; }

  async findAll(query: ListLeadsDto, user: UserRef) {
    const ctx = await this.access.resolve(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.LeadWhereInput = {
      ...this.archiveWhere(query.archived),
      ...this.visibilityWhere(ctx),
      ...(query.search ? { OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { normalizedPhone: { contains: this.normalizePhone(query.search) ?? undefined } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { normalizedEmail: { contains: this.normalizeEmail(query.search) ?? undefined } },
        { document: { contains: this.normalizeDocument(query.search) ?? undefined } },
      ] } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.temperature ? { temperature: query.temperature } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(query.assignedUserId ? { assignedUserId: query.assignedUserId } : {}),
      ...(query.managerUserId ? { managerUserId: query.managerUserId } : {}),
      ...(query.createdByUserId ? { createdByUserId: query.createdByUserId } : {}),
      ...(query.unassigned !== undefined ? { assignedUserId: query.unassigned ? null : { not: null } } : {}),
      ...(query.assigned !== undefined ? { assignedUserId: query.assigned ? { not: null } : null } : {}),
      ...(query.phone ? { OR: [{ phone: { contains: query.phone, mode: 'insensitive' } }, { normalizedPhone: this.normalizePhone(query.phone) ?? undefined }] } : {}),
      ...(query.email ? { OR: [{ email: { contains: query.email, mode: 'insensitive' } }, { normalizedEmail: this.normalizeEmail(query.email) ?? undefined }] } : {}),
      ...(query.document ? { document: { contains: this.normalizeDocument(query.document) ?? query.document } } : {}),
      ...(query.createdFrom || query.createdTo ? { createdAt: { ...(query.createdFrom ? { gte: new Date(query.createdFrom) } : {}), ...(query.createdTo ? { lte: new Date(query.createdTo) } : {}) } } : {}),
      ...(query.updatedFrom || query.updatedTo ? { updatedAt: { ...(query.updatedFrom ? { gte: new Date(query.updatedFrom) } : {}), ...(query.updatedTo ? { lte: new Date(query.updatedTo) } : {}) } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({ where, include: leadInclude, orderBy: [{ createdAt: query.order ?? 'desc' }, { id: 'desc' }], skip: (page - 1) * limit, take: limit }),
      this.prisma.lead.count({ where }),
    ]);
    return { items, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  }

  async findOne(id: string, user: UserRef) {
    const ctx = await this.access.resolve(user);
    const lead = await this.prisma.lead.findFirst({ where: { id, ...this.archiveWhere(false), ...this.visibilityWhere(ctx) }, include: leadDetailInclude });
    if (!lead) throw new NotFoundException('Lead não encontrado');
    return lead;
  }

  async create(data: CreateLeadDto, user: UserRef) {
    const ctx = await this.access.resolve(user);
    const organizationId = this.resolveOrganizationId(ctx);
    const payload = this.normalizePayload(data, organizationId, user.id);
    const identities = this.identitiesFrom(data);
    if (!payload.normalizedPhone && !payload.normalizedEmail && identities.length === 0) throw new BadRequestException('Informe telefone, e-mail ou identidade externa para criar o lead');
    await this.ensureOrganization(organizationId);
    await this.ensureAssignedUser(organizationId, payload.assignedUserId ?? null);
    await this.ensureAssignedUser(organizationId, payload.managerUserId ?? null);
    const duplicate = await this.findDuplicate(organizationId, payload, identities);
    if (duplicate) throw new ConflictException({ code: 'LEAD_DUPLICATE_CONFLICT', message: 'Já existe um lead ativo com a mesma identidade externa, documento, telefone ou e-mail nesta organização', duplicateLeadId: duplicate.leadId ?? duplicate.id });
    const lead = await this.handleDuplicateRace(async () => this.prisma.$transaction(async (tx) => {
      const created = await tx.lead.create({ data: { ...payload, status: payload.assignedUserId && !data.status ? LeadStatus.ASSIGNED : payload.status } as Prisma.LeadUncheckedCreateInput });
      for (const identity of identities) await tx.leadExternalIdentity.create({ data: { ...identity, organizationId, leadId: created.id, metadata: (identity.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue } });
      await this.recordHistory(tx, created.id, organizationId, user.id, LeadHistoryAction.CREATED, null, created, { source: created.source });
      await tx.leadEvent.create({ data: { leadId: created.id, organizationId, eventType: LeadEventType.LEAD_CREATED, description: 'Lead criado', actorUserId: user.id, payload: { source: created.source } } });
      if (created.assignedUserId) await tx.leadEvent.create({ data: { leadId: created.id, organizationId, eventType: LeadEventType.LEAD_ASSIGNED, description: 'Lead atribuído', actorUserId: user.id, payload: { assignedUserId: created.assignedUserId } } });
      return created;
    }));
    return this.findOne(lead.id, user);
  }

  async update(id: string, data: UpdateLeadDto, user: UserRef) {
    const current = await this.findOne(id, user);
    const organizationId = current.organizationId;
    const payload = this.normalizePayload(data, organizationId);
    await this.ensureAssignedUser(organizationId, payload.assignedUserId === undefined ? current.assignedUserId : payload.assignedUserId);
    await this.ensureAssignedUser(organizationId, payload.managerUserId === undefined ? current.managerUserId : payload.managerUserId);
    if (!payload.normalizedPhone && !payload.normalizedEmail && !current.externalIdentities.length && data.phone !== undefined && data.email !== undefined) throw new BadRequestException('Lead deve manter telefone, e-mail ou identidade externa');
    const duplicate = await this.findDuplicate(organizationId, payload, [], id);
    if (duplicate) throw new ConflictException({ code: 'LEAD_DUPLICATE_CONFLICT', message: 'Já existe outro lead ativo com estes dados nesta organização', duplicateLeadId: duplicate.leadId ?? duplicate.id });
    await this.handleDuplicateRace(async () => this.prisma.$transaction(async (tx) => {
      await tx.lead.update({ where: { id }, data: payload as Prisma.LeadUncheckedUpdateInput });
      await this.recordHistory(tx, id, organizationId, user.id, LeadHistoryAction.UPDATED, current, payload, { fields: Object.keys(data) });
      await tx.leadEvent.create({ data: { leadId: id, organizationId, eventType: LeadEventType.LEAD_UPDATED, description: 'Lead atualizado', actorUserId: user.id, payload: data as Prisma.InputJsonObject } });
    }));
    return this.findOne(id, user);
  }

  async assign(id: string, assignedUserId: string | null, user: UserRef) {
    const lead = await this.findOne(id, user);
    await this.ensureAssignedUser(lead.organizationId, assignedUserId);
    await this.prisma.$transaction(async (tx) => {
      await tx.lead.update({ where: { id }, data: { assignedUserId, lastAssignedAt: assignedUserId ? new Date() : null, status: assignedUserId && lead.status === LeadStatus.NEW ? LeadStatus.ASSIGNED : lead.status } });
      await this.recordHistory(tx, id, lead.organizationId, user.id, assignedUserId ? LeadHistoryAction.ASSIGNED : LeadHistoryAction.UNASSIGNED, { assignedUserId: lead.assignedUserId }, { assignedUserId }, { previousAssignedUserId: lead.assignedUserId, assignedByUserId: user.id });
      await tx.leadEvent.create({ data: { leadId: id, organizationId: lead.organizationId, eventType: assignedUserId ? LeadEventType.LEAD_ASSIGNED : LeadEventType.LEAD_UNASSIGNED, description: assignedUserId ? 'Lead atribuído' : 'Atribuição removida', actorUserId: user.id, payload: { assignedUserId } } });
    });
    return this.findOne(id, user);
  }

  async updateStatus(id: string, status: LeadStatus, user: UserRef) {
    const lead = await this.findOne(id, user);
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.lead.update({ where: { id }, data: { status, archivedAt: status === LeadStatus.ARCHIVED ? now : lead.archivedAt, convertedAt: status === LeadStatus.CONVERTED ? now : lead.convertedAt, lostAt: status === LeadStatus.LOST ? now : lead.lostAt } });
      await this.recordHistory(tx, id, lead.organizationId, user.id, LeadHistoryAction.STATUS_CHANGED, { status: lead.status }, { status }, {});
      await tx.leadEvent.create({ data: { leadId: id, organizationId: lead.organizationId, eventType: LeadEventType.LEAD_STATUS_CHANGED, description: 'Status geral do lead alterado', actorUserId: user.id, payload: { from: lead.status, to: status } } });
    });
    return this.findOne(id, user);
  }

  async updateTemperature(id: string, temperature: LeadTemperature, user: UserRef) {
    const lead = await this.findOne(id, user);
    await this.prisma.$transaction(async (tx) => {
      await tx.lead.update({ where: { id }, data: { temperature } });
      await tx.leadEvent.create({ data: { leadId: id, organizationId: lead.organizationId, eventType: LeadEventType.LEAD_TEMPERATURE_CHANGED, description: 'Temperatura alterada', actorUserId: user.id, payload: { from: lead.temperature, to: temperature } } });
    });
    return this.findOne(id, user);
  }

  async remove(id: string, user: UserRef) {
    const lead = await this.findOne(id, user);
    await this.prisma.$transaction(async (tx) => {
      await tx.lead.update({ where: { id }, data: { deletedAt: new Date(), archivedAt: new Date(), status: LeadStatus.ARCHIVED } });
      await this.recordHistory(tx, id, lead.organizationId, user.id, LeadHistoryAction.ARCHIVED, { deletedAt: lead.deletedAt, status: lead.status }, { deletedAt: new Date(), status: LeadStatus.ARCHIVED }, {});
      await tx.leadEvent.create({ data: { leadId: id, organizationId: lead.organizationId, eventType: LeadEventType.LEAD_ARCHIVED, description: 'Lead arquivado', actorUserId: user.id } });
    });
    return { success: true };
  }

  async restore(id: string, user: UserRef) {
    const ctx = await this.access.resolve(user);
    const lead = await this.prisma.lead.findFirst({ where: { id, deletedAt: { not: null }, ...this.visibilityWhere(ctx) } });
    if (!lead) throw new NotFoundException('Lead não encontrado');
    await this.prisma.$transaction(async (tx) => {
      await tx.lead.update({ where: { id }, data: { deletedAt: null, archivedAt: null, status: LeadStatus.NEW } });
      await this.recordHistory(tx, id, lead.organizationId, user.id, LeadHistoryAction.RESTORED, { deletedAt: lead.deletedAt, status: lead.status }, { deletedAt: null, status: LeadStatus.NEW }, {});
      await tx.leadEvent.create({ data: { leadId: id, organizationId: lead.organizationId, eventType: LeadEventType.LEAD_RESTORED, description: 'Lead restaurado', actorUserId: user.id } });
    });
    return this.findOne(id, user);
  }

  async setManager(id: string, managerUserId: string | null, user: UserRef) {
    const lead = await this.findOne(id, user);
    await this.ensureAssignedUser(lead.organizationId, managerUserId);
    await this.prisma.$transaction(async (tx) => {
      await tx.lead.update({ where: { id }, data: { managerUserId } });
      await this.recordHistory(tx, id, lead.organizationId, user.id, LeadHistoryAction.MANAGER_CHANGED, { managerUserId: lead.managerUserId }, { managerUserId }, {});
      await tx.leadEvent.create({ data: { leadId: id, organizationId: lead.organizationId, eventType: LeadEventType.LEAD_MANAGER_CHANGED, description: 'Gerente alterado', actorUserId: user.id, payload: { from: lead.managerUserId, to: managerUserId } } });
    });
    return this.findOne(id, user);
  }

  async history(id: string, user: UserRef) {
    const lead = await this.findOne(id, user);
    return this.prisma.leadHistory.findMany({ where: { leadId: id, organizationId: lead.organizationId }, orderBy: { createdAt: 'desc' }, include: { performedByUser: { select: safeUserSelect } } });
  }

  async duplicates(query: ListLeadsDto, user: UserRef) {
    const ctx = await this.access.resolve(user);
    const organizationId = this.resolveOrganizationId(ctx);
    const probes = { normalizedPhone: this.normalizePhone(query.phone ?? query.search), normalizedEmail: this.normalizeEmail(query.email ?? query.search), document: this.normalizeDocument(query.document ?? query.search) };
    return this.findDuplicateCandidates(organizationId, probes);
  }

  async createActivity(leadId: string, data: CreateLeadActivityDto, user: UserRef) {
    const lead = await this.findOne(leadId, user);
    await this.ensureAssignedUser(lead.organizationId, data.responsibleUserId);
    const activity = await this.prisma.$transaction(async (tx) => {
      const created = await tx.leadActivity.create({ data: { leadId, organizationId: lead.organizationId, title: data.title.trim(), dueAt: new Date(data.dueAt), status: data.status, priority: data.priority, note: data.note?.trim() || null, responsibleUserId: data.responsibleUserId, createdByUserId: user.id } });
      await tx.leadEvent.create({ data: { leadId, organizationId: lead.organizationId, eventType: LeadEventType.LEAD_ACTIVITY_CREATED, description: 'Atividade criada', actorUserId: user.id, payload: { activityId: created.id, title: created.title } } });
      return created;
    });
    return activity;
  }

  async listActivities(leadId: string, query: ListLeadActivitiesDto, user: UserRef) {
    const lead = await this.findOne(leadId, user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = { leadId, organizationId: lead.organizationId, ...(query.status ? { status: query.status } : {}), ...(query.responsibleUserId ? { responsibleUserId: query.responsibleUserId } : {}) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.leadActivity.findMany({ where, include: { responsibleUser: { select: safeUserSelect }, createdByUser: { select: safeUserSelect } }, orderBy: { dueAt: 'asc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.leadActivity.count({ where }),
    ]);
    return { items, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  }

  async updateActivity(leadId: string, activityId: string, data: UpdateLeadActivityDto, user: UserRef) {
    const lead = await this.findOne(leadId, user);
    const current = await this.prisma.leadActivity.findFirst({ where: { id: activityId, leadId, organizationId: lead.organizationId } });
    if (!current) throw new NotFoundException('Atividade não encontrada');
    if (data.responsibleUserId) await this.ensureAssignedUser(lead.organizationId, data.responsibleUserId);
    const status = data.status;
    const completedAt = data.completedAt === null ? null : data.completedAt ? new Date(data.completedAt) : status === LeadActivityStatus.COMPLETED && !current.completedAt ? new Date() : undefined;
    const activity = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.leadActivity.update({ where: { id: activityId }, data: { title: data.title?.trim(), dueAt: data.dueAt ? new Date(data.dueAt) : undefined, status, priority: data.priority, note: data.note === undefined ? undefined : data.note?.trim() || null, completedAt, responsibleUserId: data.responsibleUserId } });
      await tx.leadEvent.create({ data: { leadId, organizationId: lead.organizationId, eventType: updated.status === LeadActivityStatus.COMPLETED ? LeadEventType.LEAD_ACTIVITY_COMPLETED : LeadEventType.LEAD_ACTIVITY_UPDATED, description: updated.status === LeadActivityStatus.COMPLETED ? 'Atividade concluída' : 'Atividade atualizada', actorUserId: user.id, payload: { activityId, changes: data as Prisma.InputJsonObject } } });
      return updated;
    });
    return activity;
  }

  async getTimeline(id: string, user: UserRef) {
    const lead = await this.findOne(id, user);
    return this.timeline.forLead(id, lead.organizationId);
  }

  private archiveWhere(archived?: boolean): Prisma.LeadWhereInput {
    if (archived === true) return { deletedAt: { not: null } };
    return { deletedAt: null };
  }

  private visibilityWhere(ctx: AccessContext): Prisma.LeadWhereInput {
    const tenant = this.scopeWhere(ctx);
    if (ctx.global || ctx.permissions.includes('leads:read-all') || ctx.permissions.includes('*')) return tenant;
    return { ...tenant, OR: [{ assignedUserId: ctx.id }, { createdByUserId: ctx.id }] };
  }

  private scopeWhere(ctx: AccessContext): Prisma.LeadWhereInput {
    return ctx.global ? {} : { organizationId: ctx.organizationId! };
  }

  private resolveOrganizationId(ctx: AccessContext) {
    if (!ctx.organizationId) throw new BadRequestException('Organização é obrigatória no contexto autenticado');
    return ctx.organizationId;
  }

  private normalizePayload(data: CreateLeadDto | UpdateLeadDto, organizationId: string, createdByUserId?: string): LeadPayload {
    const normalizedPhone = data.phone === undefined ? undefined : this.normalizePhone(data.phone);
    const normalizedEmail = data.email === undefined ? undefined : this.normalizeEmail(data.email);
    return {
      name: data.name === undefined ? undefined : data.name?.trim() || null,
      phone: data.phone === undefined ? undefined : data.phone?.trim() || null,
      normalizedPhone,
      email: data.email === undefined ? undefined : data.email?.trim() || null,
      normalizedEmail,
      document: data.document === undefined ? undefined : this.normalizeDocument(data.document),
      source: data.source ?? undefined,
      status: data.status ?? undefined,
      temperature: data.temperature ?? undefined,
      notes: data.notes === undefined ? undefined : data.notes?.trim() || null,
      organizationId,
      assignedUserId: data.assignedUserId === undefined ? undefined : data.assignedUserId || null,
      managerUserId: data.managerUserId === undefined ? undefined : data.managerUserId || null,
      metadata: data.metadata as Prisma.InputJsonObject | undefined,
      lastContactAt: data.lastContactAt === undefined ? undefined : data.lastContactAt ? new Date(data.lastContactAt) : null,
      createdByUserId,
      lastAssignedAt: data.assignedUserId ? new Date() : undefined,
    } as LeadPayload;
  }

  private identitiesFrom(data: CreateLeadDto) {
    return [data.externalIdentity, ...(data.externalIdentities ?? [])].filter(Boolean) as LeadExternalIdentityDto[];
  }

  private async findDuplicate(organizationId: string, payload: LeadPayload, identities: LeadExternalIdentityDto[], ignoreId?: string) {
    for (const identity of identities) {
      const found = await this.prisma.leadExternalIdentity.findFirst({ where: { organizationId, provider: identity.provider, externalId: identity.externalId, externalAccountId: identity.externalAccountId ?? null, lead: { deletedAt: null, ...(ignoreId ? { id: { not: ignoreId } } : {}) } } });
      if (found) return found;
    }
    const baseWhere = { organizationId, deletedAt: null, ...(ignoreId ? { id: { not: ignoreId } } : {}) } satisfies Prisma.LeadWhereInput;
    if (payload.document) {
      const byDocument = await this.prisma.lead.findFirst({ where: { ...baseWhere, document: payload.document } });
      if (byDocument) return byDocument;
    }
    if (payload.normalizedPhone) {
      const byPhone = await this.prisma.lead.findFirst({ where: { ...baseWhere, normalizedPhone: payload.normalizedPhone } });
      if (byPhone) return byPhone;
    }
    if (payload.normalizedEmail) {
      const byEmail = await this.prisma.lead.findFirst({ where: { ...baseWhere, normalizedEmail: payload.normalizedEmail } });
      if (byEmail) return byEmail;
    }
    return null;
  }

  private async ensureOrganization(id: string) {
    const organization = await this.prisma.organization.findFirst({ where: { id, active: true, deletedAt: null } });
    if (!organization) throw new NotFoundException('Organização ativa não encontrada');
  }

  private async findDuplicateCandidates(organizationId: string, probes: { normalizedPhone?: string | null; normalizedEmail?: string | null; document?: string | null }, ignoreId?: string) {
    const OR: Prisma.LeadWhereInput[] = [];
    if (probes.normalizedPhone) OR.push({ normalizedPhone: probes.normalizedPhone });
    if (probes.normalizedEmail) OR.push({ normalizedEmail: probes.normalizedEmail });
    if (probes.document) OR.push({ document: probes.document });
    if (!OR.length) return [];
    return this.prisma.lead.findMany({ where: { organizationId, deletedAt: null, ...(ignoreId ? { id: { not: ignoreId } } : {}), OR }, select: { id: true, name: true, normalizedPhone: true, normalizedEmail: true, document: true, status: true, source: true, createdAt: true }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 20 });
  }

  private async handleDuplicateRace<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        throw new ConflictException({ code: 'LEAD_DUPLICATE_CONFLICT', message: 'Já existe outro lead ativo com estes dados nesta organização' });
      }
      throw error;
    }
  }

  private async recordHistory(tx: Prisma.TransactionClient, leadId: string, organizationId: string, actorUserId: string, action: LeadHistoryAction, before: unknown, after: unknown, metadata: unknown) {
    const beforeJson = this.toJson(before);
    const afterJson = this.toJson(after);
    const metadataJson = this.toJson(metadata);
    await tx.leadHistory.create({ data: { leadId, organizationId, action, description: action, performedByUserId: actorUserId, before: beforeJson, after: afterJson, metadata: metadataJson } });
    await this.audit?.record({ organizationId, actorUserId, module: 'leads', entityType: 'Lead', entityId: leadId, action, before: beforeJson, after: afterJson, metadata: metadataJson });
  }

  private toJson(value: unknown): Prisma.InputJsonValue | Prisma.JsonNull {
    if (value === null || value === undefined) return Prisma.JsonNull;
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private async ensureAssignedUser(organizationId: string, userId?: string | null) {
    if (!userId) return;
    const user = await this.prisma.user.findFirst({ where: { id: userId, active: true, deletedAt: null }, select: { organizationId: true, role: true } });
    if (!user) throw new NotFoundException({ code: 'LEAD_ASSIGNEE_INACTIVE', message: 'Usuário responsável ativo não encontrado' });
    if (![Role.CORRETOR, Role.ORG_ADMIN, Role.MANAGER, Role.BROKER].includes(user.role)) throw new BadRequestException({ code: 'LEAD_ASSIGNEE_INVALID_ROLE', message: 'Responsável inválido' });
    if (user.organizationId !== organizationId) throw new BadRequestException({ code: 'LEAD_ASSIGNEE_CROSS_TENANT', message: 'Responsável deve pertencer à mesma organização do lead' });
  }
}
