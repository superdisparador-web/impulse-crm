import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationStatus, Prisma, QueueStatus, Role } from '@prisma/client';
import { ORGANIZATION_DELETE_BLOCKERS } from './constants/delete-blockers';
import { AccessContext, AccessContextService } from '../auth/access-context.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { ListOrganizationsDto } from './dto/list-organizations.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

const organizationInclude = {
  _count: { select: { users: true, leads: true, whatsappAccounts: true, campaigns: true, messageQueues: true } },
} satisfies Prisma.OrganizationInclude;

type AuthenticatedUser = { id: string; role?: Role | string };
type OrganizationPayload = { name?: string; legalName?: string | null; document?: string | null; slug?: string; status?: OrganizationStatus; timezone?: string; locale?: string; email?: string | null; phone?: string | null; active?: boolean };

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService, private readonly accessContext: AccessContextService = new AccessContextService(prisma), private readonly audit?: AuditService) {}

  async create(data: CreateOrganizationDto, user: AuthenticatedUser) {
    const actor = await this.accessContext.resolve(user);
    this.ensurePermission(actor, 'organizations:create');
    const payload = this.normalizePayload(data);
    if (!payload.name) throw new BadRequestException('Nome da empresa é obrigatório');
    payload.slug = await this.generateAvailableSlug(payload.slug ?? payload.name);
    payload.status = payload.status ?? OrganizationStatus.ACTIVE;
    payload.active = payload.status === OrganizationStatus.ACTIVE;
    await this.ensureUniqueFields(payload);
    const created = await this.prisma.organization.create({ data: payload as Prisma.OrganizationCreateInput, include: organizationInclude });
    await this.audit?.record({ organizationId: created.id, actorUserId: actor.id, module: 'organizations', entityType: 'Organization', entityId: created.id, action: 'organization.created', after: this.auditSnapshot(created) });
    return created;
  }

  async findAll(query: ListOrganizationsDto, user: AuthenticatedUser) {
    const scope = await this.resolveReadScope(user.id);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();
    const where: Prisma.OrganizationWhereInput = {
      deletedAt: null,
      ...(scope.organizationId ? { id: scope.organizationId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { document: { contains: this.normalizeDigits(search), mode: 'insensitive' } },
              { slug: { contains: search.toLowerCase(), mode: 'insensitive' } },
              { email: { contains: search.toLowerCase(), mode: 'insensitive' } },
              { phone: { contains: this.normalizeDigits(search), mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.active !== undefined ? { status: query.active ? OrganizationStatus.ACTIVE : { not: OrganizationStatus.ACTIVE } } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({ where, include: organizationInclude, orderBy: [{ status: 'asc' }, { name: 'asc' }], skip: (page - 1) * limit, take: limit }),
      this.prisma.organization.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const scope = await this.resolveReadScope(user.id);
    const organization = await this.prisma.organization.findFirst({ where: { id, deletedAt: null, ...(scope.organizationId ? { id: scope.organizationId } : {}) }, include: organizationInclude });
    if (!organization) throw new NotFoundException('Empresa não encontrada');
    return organization;
  }

  async update(id: string, data: UpdateOrganizationDto, user: AuthenticatedUser) {
    const actor = await this.resolveReadScope(user.id);
    if (!actor.global && actor.organizationId !== id) throw new ForbiddenException('Organização fora do escopo');
    if (!actor.global) this.ensureOrganizationAdminUpdate(data);
    const before = await this.findExisting(id);
    const payload = this.normalizePayload(data);
    if (payload.name !== undefined && !payload.name) throw new BadRequestException('Nome da empresa é obrigatório');
    if (payload.slug) payload.slug = this.slugify(payload.slug);
    if (!actor.global) { delete payload.slug; delete payload.status; delete payload.active; }
    if (payload.status) payload.active = payload.status === OrganizationStatus.ACTIVE;
    else if (payload.active !== undefined) payload.status = payload.active ? OrganizationStatus.ACTIVE : OrganizationStatus.INACTIVE;
    await this.ensureUniqueFields(payload, id);
    const updated = await this.prisma.organization.update({ where: { id }, data: payload as Prisma.OrganizationUpdateInput, include: organizationInclude });
    await this.audit?.record({ organizationId: updated.id, actorUserId: actor.id, module: 'organizations', entityType: 'Organization', entityId: updated.id, action: 'organization.updated', before: this.auditSnapshot(before), after: this.auditSnapshot(updated) });
    return updated;
  }

  async setStatus(id: string, status: OrganizationStatus, user: AuthenticatedUser) {
    await this.ensureGlobalAdmin(user.id);
    const actor = await this.resolveReadScope(user.id);
    if (!actor.global && actor.organizationId !== id) throw new ForbiddenException('Organização fora do escopo');
    const before = await this.findExisting(id);
    const updated = await this.prisma.organization.update({ where: { id }, data: this.statusData(status), include: organizationInclude });
    await this.audit?.record({ organizationId: updated.id, actorUserId: actor.id, module: 'organizations', entityType: 'Organization', entityId: updated.id, action: status === OrganizationStatus.SUSPENDED ? 'organization.suspended' : 'organization.status_changed', before: this.auditSnapshot(before), after: this.auditSnapshot(updated) });
    return updated;
  }

  async remove(id: string, user: AuthenticatedUser) {
    await this.ensureGlobalAdmin(user.id);
    const before = await this.findExisting(id);
    const blockers = await this.getDeleteBlockers(id);
    if (blockers.length) {
      throw new ConflictException(`Não é possível excluir a organização enquanto houver ${blockers.join(', ')}.`);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.organization.update({ where: { id }, data: this.statusData(OrganizationStatus.ARCHIVED) });
    });
    await this.audit?.record({ organizationId: id, actorUserId: user.id, module: 'organizations', entityType: 'Organization', entityId: id, action: 'organization.archived', before: this.auditSnapshot(before), after: { status: OrganizationStatus.ARCHIVED } });
    return { success: true };
  }

  private normalizePayload(data: CreateOrganizationDto | UpdateOrganizationDto): OrganizationPayload {
    const payload: OrganizationPayload = { ...data };
    if (data.name !== undefined) payload.name = data.name.trim();
    if ('legalName' in data && data.legalName !== undefined) payload.legalName = data.legalName.trim() || null;
    if ('slug' in data && data.slug !== undefined) payload.slug = this.slugify(data.slug);
    if (data.document !== undefined) payload.document = this.normalizeDigits(data.document) || null;
    if (data.email !== undefined) payload.email = data.email.trim().toLowerCase() || null;
    if (data.phone !== undefined) payload.phone = this.normalizeDigits(data.phone) || null;
    if ('timezone' in data && data.timezone !== undefined) payload.timezone = data.timezone.trim() || 'America/Sao_Paulo';
    if ('locale' in data && data.locale !== undefined) payload.locale = data.locale.trim() || 'pt-BR';
    return payload;
  }

  private normalizeDigits(value: string) { return value.replace(/\D/g, ''); }

  private slugify(value: string) { return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120); }

  private async ensureUniqueFields(data: OrganizationPayload, ignoreId?: string) {
    const checks: Prisma.OrganizationWhereInput[] = [];
    if (data.document) checks.push({ document: data.document });
    if (data.slug) checks.push({ slug: { equals: data.slug, mode: 'insensitive' } });
    if (data.email) checks.push({ email: { equals: data.email, mode: 'insensitive' } });
    if (!checks.length) return;
    const existing = await this.prisma.organization.findFirst({ where: { deletedAt: null, OR: checks, ...(ignoreId ? { id: { not: ignoreId } } : {}) }, select: { document: true, email: true, slug: true } });
    if (!existing) return;
    if (data.document && existing.document === data.document) throw new ConflictException('Documento já cadastrado para outra empresa');
    if (data.slug && 'slug' in existing && existing.slug?.toLowerCase() === data.slug) throw new ConflictException('Slug já cadastrado para outra empresa');
    if (data.email && existing.email?.toLowerCase() === data.email) throw new ConflictException('E-mail já cadastrado para outra empresa');
  }

  private async resolveReadScope(userId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, status: 'ACTIVE', deletedAt: null }, select: { role: true, organizationId: true, organization: { select: { status: true, active: true, deletedAt: true } } } });
    if (!user) throw new ForbiddenException('Usuário sem acesso ativo');
    if (user.role === Role.ADMIN && user.organizationId === null) return { id: userId, global: true, organizationId: null, role: user.role };
    if (!user.organizationId || (user.organization?.status ?? (user.organization?.active ? OrganizationStatus.ACTIVE : undefined)) !== OrganizationStatus.ACTIVE || user.organization?.deletedAt) throw new ForbiddenException('Usuário sem organização ativa');
    return { id: userId, global: false, organizationId: user.organizationId, role: user.role };
  }

  private async ensureGlobalAdmin(userId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, status: 'ACTIVE', deletedAt: null, organizationId: null }, select: { id: true } });
    if (!user) throw new ForbiddenException('Apenas administrador global pode executar esta operação');
  }

  private async findExisting(id: string) {
    const organization = await this.prisma.organization.findFirst({ where: { id, deletedAt: null }, select: { id: true, name: true, legalName: true, document: true, slug: true, status: true, active: true, timezone: true, locale: true, email: true, phone: true, deletedAt: true } });
    if (!organization) throw new NotFoundException('Empresa não encontrada');
    return organization;
  }

  private ensurePermission(actor: AccessContext, permission: string) {
    if (actor.permissions.includes('*') || actor.permissions.includes(permission)) return;
    throw new ForbiddenException('Permissão insuficiente');
  }

  private ensureOrganizationAdminUpdate(data: UpdateOrganizationDto) {
    if (data.slug !== undefined || data.status !== undefined || data.active !== undefined) throw new ForbiddenException('Campo reservado ao administrador global');
  }

  private statusData(status: OrganizationStatus) {
    const archivedAt = status === OrganizationStatus.ARCHIVED ? new Date() : null;
    return { status, active: status === OrganizationStatus.ACTIVE, deletedAt: archivedAt };
  }

  private auditSnapshot(value: object): Prisma.InputJsonObject {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
  }

  private async generateAvailableSlug(value: string, ignoreId?: string): Promise<string> {
    const base = this.slugify(value);
    if (!base) throw new BadRequestException('Slug inválido');
    for (let suffix = 0; suffix < 100; suffix += 1) {
      const candidate = suffix === 0 ? base : `${base}-${suffix + 1}`;
      const existing = await this.prisma.organization.findFirst({ where: { slug: { equals: candidate, mode: 'insensitive' }, deletedAt: null, ...(ignoreId ? { id: { not: ignoreId } } : {}) }, select: { id: true } });
      if (!existing) return candidate;
    }
    throw new ConflictException('Não foi possível gerar slug único');
  }

  private async getDeleteBlockers(id: string) {
    const [users, leads, whatsappAccounts, whatsappTemplates, campaigns, messageQueues] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { organizationId: id, deletedAt: null } }),
      this.prisma.lead.count({ where: { organizationId: id, deletedAt: null } }),
      this.prisma.whatsappAccount.count({ where: { organizationId: id, deletedAt: null } }),
      this.prisma.whatsappTemplate.count({ where: { organizationId: id } }),
      this.prisma.campaign.count({ where: { organizationId: id, deletedAt: null } }),
      this.prisma.messageQueue.count({ where: { organizationId: id, status: { notIn: [QueueStatus.SENT, QueueStatus.FAILED, QueueStatus.CANCELED] } } }),
    ]);
    const counts = [users, leads, whatsappAccounts, whatsappTemplates, campaigns, messageQueues];
    return ORGANIZATION_DELETE_BLOCKERS.filter((_, index) => counts[index] > 0);
  }
}
