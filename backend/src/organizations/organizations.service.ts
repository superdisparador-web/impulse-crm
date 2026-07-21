import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, QueueStatus, Role } from '@prisma/client';
import { ORGANIZATION_DELETE_BLOCKERS } from './constants/delete-blockers';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { ListOrganizationsDto } from './dto/list-organizations.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

const organizationInclude = {
  _count: { select: { users: true, leads: true, whatsappAccounts: true, campaigns: true, messageQueues: true } },
} satisfies Prisma.OrganizationInclude;

type AuthenticatedUser = { id: string; role?: Role | string };
type OrganizationPayload = { name?: string; document?: string | null; email?: string | null; phone?: string | null; active?: boolean };

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOrganizationDto, user: AuthenticatedUser) {
    await this.ensureGlobalAdmin(user.id);
    const payload = this.normalizePayload(data);
    if (!payload.name) throw new BadRequestException('Nome da empresa é obrigatório');
    await this.ensureUniqueFields(payload);
    return this.prisma.organization.create({ data: payload as Prisma.OrganizationCreateInput, include: organizationInclude });
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
              { email: { contains: search.toLowerCase(), mode: 'insensitive' } },
              { phone: { contains: this.normalizeDigits(search), mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.active !== undefined ? { active: query.active } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({ where, include: organizationInclude, orderBy: [{ active: 'desc' }, { name: 'asc' }], skip: (page - 1) * limit, take: limit }),
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
    await this.ensureGlobalAdmin(user.id);
    await this.findExisting(id);
    const payload = this.normalizePayload(data);
    if (payload.name !== undefined && !payload.name) throw new BadRequestException('Nome da empresa é obrigatório');
    await this.ensureUniqueFields(payload, id);
    return this.prisma.organization.update({ where: { id }, data: payload as Prisma.OrganizationUpdateInput, include: organizationInclude });
  }

  async remove(id: string, user: AuthenticatedUser) {
    await this.ensureGlobalAdmin(user.id);
    await this.findExisting(id);
    const blockers = await this.getDeleteBlockers(id);
    if (blockers.length) {
      throw new ConflictException(`Não é possível excluir a organização enquanto houver ${blockers.join(', ')}.`);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.organization.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
    });
    return { success: true };
  }

  private normalizePayload(data: CreateOrganizationDto | UpdateOrganizationDto): OrganizationPayload {
    const payload: OrganizationPayload = { ...data };
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.document !== undefined) payload.document = this.normalizeDigits(data.document) || null;
    if (data.email !== undefined) payload.email = data.email.trim().toLowerCase() || null;
    if (data.phone !== undefined) payload.phone = this.normalizeDigits(data.phone) || null;
    return payload;
  }

  private normalizeDigits(value: string) { return value.replace(/\D/g, ''); }

  private async ensureUniqueFields(data: OrganizationPayload, ignoreId?: string) {
    const checks: Prisma.OrganizationWhereInput[] = [];
    if (data.document) checks.push({ document: data.document });
    if (data.email) checks.push({ email: { equals: data.email, mode: 'insensitive' } });
    if (!checks.length) return;
    const existing = await this.prisma.organization.findFirst({ where: { deletedAt: null, OR: checks, ...(ignoreId ? { id: { not: ignoreId } } : {}) }, select: { document: true, email: true } });
    if (!existing) return;
    if (data.document && existing.document === data.document) throw new ConflictException('Documento já cadastrado para outra empresa');
    if (data.email && existing.email?.toLowerCase() === data.email) throw new ConflictException('E-mail já cadastrado para outra empresa');
  }

  private async resolveReadScope(userId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, active: true, deletedAt: null }, select: { role: true, organizationId: true, organization: { select: { active: true, deletedAt: true } } } });
    if (!user) throw new ForbiddenException('Usuário sem acesso ativo');
    if (user.role === Role.ADMIN && user.organizationId === null) return { global: true, organizationId: null };
    if (!user.organizationId || !user.organization?.active || user.organization.deletedAt) throw new ForbiddenException('Usuário sem organização ativa');
    return { global: false, organizationId: user.organizationId };
  }

  private async ensureGlobalAdmin(userId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, role: Role.ADMIN, active: true, deletedAt: null, organizationId: null }, select: { id: true } });
    if (!user) throw new ForbiddenException('Apenas administrador global pode executar esta operação');
  }

  private async findExisting(id: string) {
    const organization = await this.prisma.organization.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!organization) throw new NotFoundException('Empresa não encontrada');
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
