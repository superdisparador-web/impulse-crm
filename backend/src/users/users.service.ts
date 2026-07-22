import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { AccessContext, AccessContextService, AuthenticatedUserRef } from '../auth/access-context.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { USER_PASSWORD_RESET_SECURITY_NOTES } from './constants/password-reset-security';
import { PasswordService } from '../auth/security/password.service';

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  active: true,
  organizationId: true,
  organization: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.UserSelect;

type UserPayload = { name?: string; email?: string; password?: string; phone?: string | null; role?: Role; active?: boolean; organizationId?: string | null };

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly accessContext: AccessContextService, private readonly passwords: PasswordService = new PasswordService()) {}

  async findAll(query: ListUsersDto = {}, user?: AuthenticatedUserRef) {
    const actor = await this.accessContext.resolve(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(actor.global ? (query.organizationId ? { organizationId: query.organizationId } : {}) : { organizationId: actor.organizationId }),
      ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search.toLowerCase(), mode: 'insensitive' } }] } : {}),
      ...(query.active !== undefined ? { active: query.active } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, select: userSelect, orderBy: [{ active: 'desc' }, { name: 'asc' }], skip: (page - 1) * limit, take: limit }),
      this.prisma.user.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  }

  async findOne(id: string, user?: AuthenticatedUserRef) {
    const actor = await this.accessContext.resolve(user);
    const target = await this.findExisting(id);
    this.ensureCanRead(actor, target);
    return target;
  }

  async findMe(user: AuthenticatedUserRef) {
    return this.findOne(user.id, user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({ where: { email: email.trim().toLowerCase(), deletedAt: null } });
  }

  async create(data: CreateUserDto | { name: string; email: string; password: string; role?: Role | string }, user?: AuthenticatedUserRef) {
    const actor = await this.accessContext.resolve(user, { allowSystem: true });
    this.ensureCanManage(actor);
    const payload = await this.normalizePayload(data, actor, false);
    if (!payload.name) throw new BadRequestException('Nome do usuário é obrigatório');
    if (!payload.password) throw new BadRequestException('Senha é obrigatória');
    await this.ensureEmailAvailable(payload.email!);
    if (payload.organizationId) await this.ensureOrganization(payload.organizationId);
    return this.prisma.user.create({ data: payload as Prisma.UserCreateInput, select: userSelect });
  }

  async update(id: string, data: UpdateUserDto, user: AuthenticatedUserRef) {
    const actor = await this.accessContext.resolve(user);
    this.ensureCanManage(actor);
    const target = await this.findExisting(id);
    this.ensureCanManageTarget(actor, target);
    const payload = await this.normalizePayload(data, actor, true, target);
    if (payload.name !== undefined && !payload.name) throw new BadRequestException('Nome do usuário é obrigatório');
    if (payload.email) await this.ensureEmailAvailable(payload.email, id);
    if (payload.organizationId) await this.ensureOrganization(payload.organizationId);
    return this.prisma.user.update({ where: { id }, data: payload, select: userSelect });
  }

  async updateStatus(id: string, active: boolean, user: AuthenticatedUserRef) {
    const actor = await this.accessContext.resolve(user);
    this.ensureCanManage(actor);
    const target = await this.findExisting(id);
    this.ensureCanManageTarget(actor, target);
    if (id === actor.id && active === false) throw new BadRequestException('Não é possível inativar o próprio usuário');
    return this.prisma.user.update({ where: { id }, data: { active }, select: userSelect });
  }

  async resetPassword(id: string, password: string, user: AuthenticatedUserRef) {
    const actor = await this.accessContext.resolve(user);
    this.ensureCanManage(actor);
    const target = await this.findExisting(id);
    this.ensureCanManageTarget(actor, target);
    const updated = await this.prisma.user.update({ where: { id }, data: { password: await this.passwords.hash(password) }, select: userSelect });
    return { ...updated, security: { tokenInvalidation: USER_PASSWORD_RESET_SECURITY_NOTES } };
  }

  async remove(id: string, user: AuthenticatedUserRef) {
    const actor = await this.accessContext.resolve(user);
    this.ensureCanManage(actor);
    const target = await this.findExisting(id);
    this.ensureCanManageTarget(actor, target);
    if (id === actor.id) throw new BadRequestException('Não é possível excluir o próprio usuário');
    await this.prisma.user.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
    return { success: true };
  }

  private async normalizePayload(data: CreateUserDto | UpdateUserDto | { name: string; email: string; password: string; role?: Role | string }, actor: AccessContext, partial: boolean, target?: Prisma.UserGetPayload<{ select: typeof userSelect }>): Promise<UserPayload> {
    const payload: UserPayload = {};
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.email !== undefined) payload.email = data.email.trim().toLowerCase();
    if ('phone' in data && data.phone !== undefined) payload.phone = data.phone.trim() || null;
    if ('active' in data && data.active !== undefined) payload.active = data.active;
    if ('password' in data && data.password) payload.password = data.password.startsWith('$2') ? data.password : await this.passwords.hash(data.password);
    if (!partial && payload.active === undefined) payload.active = true;

    const requestedRole = 'role' in data && data.role ? data.role as Role : undefined;
    if (actor.global) payload.role = requestedRole ?? (partial ? undefined : Role.CORRETOR);
    else if (!partial) payload.role = Role.CORRETOR;
    else if (requestedRole && requestedRole !== target?.role) throw new ForbiddenException('Não é permitido alterar papel de usuário');

    if (actor.global) {
      if ('organizationId' in data && data.organizationId !== undefined) payload.organizationId = data.organizationId || null;
      else if (!partial) payload.organizationId = null;
    } else {
      if (!partial) payload.organizationId = actor.organizationId;
    }
    return payload;
  }

  private ensureCanRead(actor: AccessContext, target: Prisma.UserGetPayload<{ select: typeof userSelect }>) {
    if (actor.global || target.id === actor.id || (actor.role === Role.ADMIN && target.organizationId === actor.organizationId)) return;
    throw new NotFoundException('Usuário não encontrado');
  }

  private ensureCanManage(actor: AccessContext) {
    if (actor.role === Role.ADMIN) return;
    throw new ForbiddenException('Permissão insuficiente');
  }

  private ensureCanManageTarget(actor: AccessContext, target: Prisma.UserGetPayload<{ select: typeof userSelect }>) {
    if (actor.global) return;
    if (target.organizationId === actor.organizationId) return;
    throw new NotFoundException('Usuário não encontrado');
  }

  private async ensureEmailAvailable(email: string, ignoreId?: string) {
    const existing = await this.prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' }, deletedAt: null, ...(ignoreId ? { id: { not: ignoreId } } : {}) } });
    if (existing) throw new ConflictException('E-mail já cadastrado');
  }

  private async ensureOrganization(organizationId: string) {
    const organization = await this.prisma.organization.findFirst({ where: { id: organizationId, deletedAt: null, active: true }, select: { id: true } });
    if (!organization) throw new NotFoundException('Empresa não encontrada');
  }

  private async findExisting(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null }, select: userSelect });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

}
