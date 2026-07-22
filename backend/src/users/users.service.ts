import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RefreshTokenStatus, Role, UserStatus } from '@prisma/client';
import { AccessContext, AccessContextService, AuthenticatedUserRef } from '../auth/access-context.service';
import { AuditService } from '../audit/audit.service';
import { IamService } from '../iam/iam.service';
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
  status: true,
  organizationId: true,
  organization: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.UserSelect;

type UserPayload = { name?: string; email?: string; password?: string; phone?: string | null; role?: Role; active?: boolean; status?: UserStatus; organizationId?: string | null };

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly accessContext: AccessContextService, private readonly passwords: PasswordService = new PasswordService(), private readonly iam?: IamService, private readonly audit?: AuditService) {}

  async findAll(query: ListUsersDto = {}, user?: AuthenticatedUserRef) {
    const actor = await this.accessContext.resolve(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(actor.global ? (query.organizationId ? { organizationId: query.organizationId } : {}) : { organizationId: actor.organizationId }),
      ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search.toLowerCase(), mode: 'insensitive' } }] } : {}),
      ...(query.active !== undefined ? { status: query.active ? UserStatus.ACTIVE : { not: UserStatus.ACTIVE } } : {}),
      ...(query.role ? { role: query.role } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, select: userSelect, orderBy: [{ status: 'asc' }, { name: 'asc' }], skip: (page - 1) * limit, take: limit }),
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
    if (!payload.organizationId && payload.role !== Role.ADMIN && payload.role !== Role.GLOBAL_ADMIN) throw new BadRequestException('Usuário deve pertencer a uma organização');
    if (payload.organizationId) await this.ensureOrganization(payload.organizationId);
    const created = await this.prisma.user.create({ data: payload as Prisma.UserCreateInput, select: userSelect });
    await this.syncUserRole(created.id, created.role, created.organizationId);
    await this.recordAudit('user.created', actor.id, created.organizationId, created.id, undefined, this.auditSnapshot(created));
    return created;
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
    const updated = await this.prisma.user.update({ where: { id }, data: payload, select: userSelect });
    if (payload.status && payload.status !== UserStatus.ACTIVE) await this.revokeSessions(id);
    if (payload.role && payload.role !== target.role) {
      await this.syncUserRole(updated.id, updated.role, updated.organizationId);
      await this.recordAudit('user.role_changed', actor.id, updated.organizationId, updated.id, { role: target.role }, { role: updated.role });
    }
    await this.recordAudit('user.updated', actor.id, updated.organizationId, updated.id, this.auditSnapshot(target), this.auditSnapshot(updated));
    return updated;
  }

  async updateStatus(id: string, active: boolean, user: AuthenticatedUserRef) {
    const actor = await this.accessContext.resolve(user);
    this.ensureCanManage(actor);
    const target = await this.findExisting(id);
    this.ensureCanManageTarget(actor, target);
    if (id === actor.id && active === false) throw new BadRequestException('Não é possível inativar o próprio usuário');
    const status = active ? UserStatus.ACTIVE : UserStatus.INACTIVE;
    const updated = await this.prisma.user.update({ where: { id }, data: this.statusData(status), select: userSelect });
    if (!active) await this.revokeSessions(id);
    await this.recordAudit(active ? 'user.activated' : 'user.deactivated', actor.id, updated.organizationId, updated.id, this.auditSnapshot(target), this.auditSnapshot(updated));
    return updated;
  }

  async resetPassword(id: string, password: string, user: AuthenticatedUserRef) {
    const actor = await this.accessContext.resolve(user);
    this.ensureCanManage(actor);
    const target = await this.findExisting(id);
    this.ensureCanManageTarget(actor, target);
    const updated = await this.prisma.user.update({ where: { id }, data: { password: await this.passwords.hash(password) }, select: userSelect });
    await this.revokeSessions(id);
    await this.recordAudit('user.password_reset', actor.id, updated.organizationId, updated.id, undefined, { password: '[REDACTED]' });
    return { ...updated, security: { tokenInvalidation: USER_PASSWORD_RESET_SECURITY_NOTES } };
  }

  async remove(id: string, user: AuthenticatedUserRef) {
    const actor = await this.accessContext.resolve(user);
    this.ensureCanManage(actor);
    const target = await this.findExisting(id);
    this.ensureCanManageTarget(actor, target);
    if (id === actor.id) throw new BadRequestException('Não é possível excluir o próprio usuário');
    await this.prisma.user.update({ where: { id }, data: this.statusData(UserStatus.ARCHIVED) });
    await this.revokeSessions(id);
    await this.recordAudit('user.archived', actor.id, target.organizationId, id, this.auditSnapshot(target), { status: UserStatus.ARCHIVED });
    return { success: true };
  }

  private async revokeSessions(userId: string) {
    if (!this.prisma.authSession?.updateMany || !this.prisma.refreshToken?.updateMany) return;
    await this.prisma.$transaction([
      this.prisma.authSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
      this.prisma.refreshToken.updateMany({ where: { userId, status: RefreshTokenStatus.ACTIVE }, data: { status: RefreshTokenStatus.REVOKED, revokedAt: new Date() } }),
    ]);
  }

  private async normalizePayload(data: CreateUserDto | UpdateUserDto | { name: string; email: string; password: string; role?: Role | string }, actor: AccessContext, partial: boolean, target?: Prisma.UserGetPayload<{ select: typeof userSelect }>): Promise<UserPayload> {
    const payload: UserPayload = {};
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.email !== undefined) payload.email = data.email.trim().toLowerCase();
    if ('phone' in data && data.phone !== undefined) payload.phone = data.phone.trim() || null;
    if ('active' in data && data.active !== undefined) { payload.status = data.active ? UserStatus.ACTIVE : UserStatus.INACTIVE; payload.active = data.active; }
    if ('password' in data && data.password) payload.password = data.password.startsWith('$2') ? data.password : await this.passwords.hash(data.password);
    if (!partial && payload.active === undefined) { payload.active = true; payload.status = UserStatus.ACTIVE; }

    const requestedRole = 'role' in data && data.role ? data.role as Role : undefined;
    if (actor.global) payload.role = requestedRole ?? (partial ? undefined : Role.CORRETOR);
    else if (!partial) payload.role = Role.CORRETOR;
    else if (requestedRole && requestedRole !== target?.role) throw new ForbiddenException('Não é permitido alterar papel de usuário');

    if (actor.global) {
      if ('organizationId' in data && data.organizationId !== undefined) payload.organizationId = data.organizationId || null;
      else if (!partial) payload.organizationId = requestedRole === Role.ADMIN || requestedRole === Role.GLOBAL_ADMIN ? null : undefined;
    } else {
      if (!partial) payload.organizationId = actor.organizationId;
    }
    return payload;
  }

  private ensureCanRead(actor: AccessContext, target: Prisma.UserGetPayload<{ select: typeof userSelect }>) {
    if (actor.global || target.id === actor.id || (actor.permissions.includes('users:read') && target.organizationId === actor.organizationId)) return;
    throw new NotFoundException('Usuário não encontrado');
  }

  private ensureCanManage(actor: AccessContext) {
    if (actor.permissions.includes('*') || actor.permissions.some((permission) => ['users:create', 'users:update', 'users:activate', 'users:deactivate', 'users:archive', 'users:reset-password'].includes(permission))) return;
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
    const organization = await this.prisma.organization.findFirst({ where: { id: organizationId, deletedAt: null, status: 'ACTIVE' }, select: { id: true } });
    if (!organization) throw new NotFoundException('Empresa não encontrada');
  }

  private async syncUserRole(userId: string, role: Role, organizationId: string | null) {
    if (this.iam) await this.iam.replaceUserRole(userId, role, organizationId);
  }

  private statusData(status: UserStatus) {
    return { status, active: status === UserStatus.ACTIVE, deletedAt: status === UserStatus.ARCHIVED ? new Date() : null };
  }

  private async recordAudit(action: string, actorUserId: string, organizationId: string | null, entityId: string, before?: Prisma.InputJsonObject, after?: Prisma.InputJsonObject) {
    if (!this.audit) return;
    await this.audit.record({ organizationId, actorUserId, module: 'users', entityType: 'User', entityId, action, before, after });
  }

  private auditSnapshot(value: object): Prisma.InputJsonObject {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
  }

  private async findExisting(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null }, select: userSelect });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

}
