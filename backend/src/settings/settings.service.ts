import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AccessContext, AccessContextService, AuthenticatedUserRef } from '../auth/access-context.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateBrandingSettingsDto, UpdateMeSettingsDto, UpdateNotificationSettingsDto, UpdateOperationalSettingsDto, UpdateOrganizationSettingsDto, UpdateSecuritySettingsDto, UpdateSystemSettingsDto } from './dto/settings.dto';

export const SETTINGS_PERMISSIONS = [
  'settings:self:read', 'settings:self:update', 'settings:organization:read', 'settings:organization:update',
  'settings:users:manage', 'settings:teams:manage', 'settings:roles:read', 'settings:roles:manage',
  'settings:security:self', 'settings:security:organization', 'settings:security:global',
  'settings:notifications:self', 'settings:notifications:organization', 'settings:branding:read', 'settings:branding:update',
  'settings:operations:read', 'settings:operations:update', 'settings:integrations:read', 'settings:integrations:manage',
  'settings:audit:self', 'settings:audit:team', 'settings:audit:organization', 'settings:audit:global',
  'settings:system:read', 'settings:system:update',
] as const;

const RESERVED = new Set(['settings:security:global', 'settings:audit:global', 'settings:system:read', 'settings:system:update', 'settings:roles:manage']);
const ROLE_LEVEL: Record<string, number> = { GLOBAL_ADMIN: 4, ORG_ADMIN: 3, MANAGER: 2, BROKER: 1 };

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService, private readonly access: AccessContextService, private readonly auditService: AuditService) {}

  async me(user: AuthenticatedUserRef) {
    const actor = await this.access.resolve(user);
    const profile = await this.prisma.user.findUnique({ where: { id: actor.id }, select: { id: true, name: true, email: true, phone: true, role: true, organizationId: true, organization: { select: { id: true, name: true } }, createdAt: true, updatedAt: true, settings: true, authSessions: { where: { revokedAt: null, expiresAt: { gt: new Date() } }, select: { id: true, createdAt: true, lastAccessedAt: true, expiresAt: true, device: true, ipAddress: true } } } });
    if (!profile) throw new NotFoundException('Usuário não encontrado');
    return { ...profile, businessRole: this.roleCode(actor), permissions: actor.permissions, capabilities: this.capabilities(actor) };
  }

  async updateMe(dto: UpdateMeSettingsDto, user: AuthenticatedUserRef) {
    const actor = await this.access.resolve(user);
    const { name, phone, ...settings } = dto;
    const before = await this.prisma.user.findUnique({ where: { id: actor.id }, select: { name: true, phone: true, settings: true } });
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: actor.id }, data: { ...(name !== undefined ? { name: name.trim() } : {}), ...(phone !== undefined ? { phone: phone.trim() || null } : {}) } }),
      this.prisma.userPreference.upsert({ where: { userId: actor.id }, create: { userId: actor.id, ...settings }, update: settings }),
    ]);
    await this.record(actor, 'settings.profile.updated', 'User', actor.id, before, dto);
    return this.me(user);
  }

  async organization(organizationId: string | undefined, user: AuthenticatedUserRef) {
    const actor = await this.access.resolve(user); this.require(actor, 'settings:organization:read');
    const id = this.organizationScope(actor, organizationId);
    const organization = await this.prisma.organization.findFirst({ where: { id, deletedAt: null }, select: { id: true, name: true, legalName: true, document: true, email: true, phone: true, timezone: true, locale: true, status: true, createdAt: true, settings: true } });
    if (!organization) throw new NotFoundException('Organização não encontrada');
    return organization;
  }

  async updateOrganization(organizationId: string | undefined, dto: UpdateOrganizationSettingsDto, user: AuthenticatedUserRef) {
    const actor = await this.access.resolve(user); this.require(actor, 'settings:organization:update');
    const id = this.organizationScope(actor, organizationId);
    const before = await this.organization(id, user);
    const updated = await this.prisma.organization.update({ where: { id }, data: dto, select: { id: true, name: true, legalName: true, document: true, email: true, phone: true, timezone: true, locale: true, status: true, createdAt: true, settings: true } });
    await this.record(actor, 'settings.organization.updated', 'Organization', id, before, updated);
    return updated;
  }

  async permissions(user: AuthenticatedUserRef) {
    const actor = await this.access.resolve(user); this.require(actor, 'settings:roles:read');
    const roles = await this.prisma.rbacRole.findMany({ where: { organizationId: null, deletedAt: null, code: { in: ['GLOBAL_ADMIN', 'ORG_ADMIN', 'MANAGER', 'BROKER'] } }, select: { id: true, code: true, name: true, permissions: { select: { permission: { select: { code: true, description: true } } } } }, orderBy: { code: 'asc' } });
    return { actorRole: this.roleCode(actor), editable: actor.global, businessLabels: { GLOBAL_ADMIN: 'Administrador global', ORG_ADMIN: 'Superintendente', MANAGER: 'Gerente', BROKER: 'Corretor' }, reserved: [...RESERVED], roles };
  }

  async updatePermissions(roleCode: string, permissionCodes: string[], user: AuthenticatedUserRef) {
    const actor = await this.access.resolve(user); this.require(actor, 'settings:roles:manage');
    if (!actor.global) throw new ForbiddenException('A matriz global é reservada ao administrador global');
    if (roleCode === 'GLOBAL_ADMIN') throw new ForbiddenException('Permissões obrigatórias do administrador global não podem ser removidas');
    const role = await this.prisma.rbacRole.findFirst({ where: { code: roleCode, organizationId: null, deletedAt: null } });
    if (!role) throw new NotFoundException('Função não encontrada');
    const unique = [...new Set(permissionCodes)];
    const allowed = await this.prisma.permission.findMany({ where: { code: { in: unique } }, select: { id: true, code: true } });
    if (allowed.length !== unique.length || unique.some((code) => RESERVED.has(code))) throw new ForbiddenException('Permissão inexistente ou reservada');
    await this.prisma.$transaction([this.prisma.rolePermission.deleteMany({ where: { roleId: role.id } }), ...allowed.map((permission) => this.prisma.rolePermission.create({ data: { roleId: role.id, permissionId: permission.id } }))]);
    await this.record(actor, 'settings.permissions.updated', 'RbacRole', role.id, undefined, { roleCode, permissions: unique });
    return this.permissions(user);
  }

  notifications(user: AuthenticatedUserRef) { return this.me(user); }
  async updateNotifications(dto: UpdateNotificationSettingsDto, user: AuthenticatedUserRef) {
    const actor = await this.access.resolve(user); const organizationKeys = ['notifyLeadFailures', 'notifyWhatsappHealth'] as const;
    const orgData = Object.fromEntries(organizationKeys.filter((key) => dto[key] !== undefined).map((key) => [key, dto[key]]));
    const selfData = Object.fromEntries(Object.entries(dto).filter(([key]) => !organizationKeys.includes(key as typeof organizationKeys[number])));
    if (Object.keys(orgData).length) { this.require(actor, 'settings:notifications:organization'); const id = this.organizationScope(actor); await this.prisma.organizationSetting.upsert({ where: { organizationId: id }, create: { organizationId: id, ...orgData }, update: orgData }); }
    if (Object.keys(selfData).length) await this.prisma.userPreference.upsert({ where: { userId: actor.id }, create: { userId: actor.id, ...selfData }, update: selfData });
    await this.record(actor, 'settings.notifications.updated', 'User', actor.id, undefined, dto); return this.me(user);
  }

  async scopedSettings(kind: 'branding'|'operations'|'security', user: AuthenticatedUserRef) { const actor = await this.access.resolve(user); this.require(actor, `settings:${kind === 'operations' ? 'operations' : kind}:read`, kind === 'security' ? 'settings:security:self' : undefined); if (kind === 'security' && actor.global) return this.prisma.systemSetting.upsert({ where: { key: 'global' }, create: {}, update: {} }); if (kind === 'security' && !actor.roles.includes('ORG_ADMIN')) return { scope: 'self', sessions: (await this.me(user)).authSessions }; const id = this.organizationScope(actor); return this.prisma.organizationSetting.upsert({ where: { organizationId: id }, create: { organizationId: id }, update: {} }); }
  async updateScoped(kind: 'branding'|'operations'|'security', dto: UpdateBrandingSettingsDto|UpdateOperationalSettingsDto|UpdateSecuritySettingsDto, user: AuthenticatedUserRef) { const actor = await this.access.resolve(user); const permission = kind === 'security' ? (actor.global ? 'settings:security:global' : 'settings:security:organization') : `settings:${kind === 'operations' ? 'operations' : kind}:update`; this.require(actor, permission); const id = this.organizationScope(actor); const before = await this.prisma.organizationSetting.findUnique({ where: { organizationId: id } }); const after = await this.prisma.organizationSetting.upsert({ where: { organizationId: id }, create: { organizationId: id, ...dto }, update: dto }); await this.record(actor, `settings.${kind}.updated`, 'OrganizationSetting', after.id, before, after); return after; }

  async integrations(user: AuthenticatedUserRef) { const actor = await this.access.resolve(user); this.require(actor, 'settings:integrations:read'); return { scope: actor.global ? 'global' : actor.organizationId, items: [{ id: 'whatsapp', name: 'WhatsApp Oficial / Meta', status: 'managed', health: 'Disponível no módulo responsável', href: '/whatsapp' }, { id: 'imports', name: 'Importação', status: 'available', health: 'Operacional', href: '/leads' }], diagnosticsVisible: actor.global, secretsExposed: false }; }
  async audit(user: AuthenticatedUserRef) { const actor = await this.access.resolve(user); const permission = actor.global ? 'settings:audit:global' : actor.roles.includes('ORG_ADMIN') ? 'settings:audit:organization' : actor.roles.includes('MANAGER') ? 'settings:audit:team' : 'settings:audit:self'; this.require(actor, permission); return this.prisma.auditLog.findMany({ where: actor.global ? {} : actor.roles.includes('ORG_ADMIN') ? { organizationId: actor.organizationId } : { actorUserId: actor.id }, select: { id: true, occurredAt: true, module: true, action: true, entityType: true, entityId: true, before: true, after: true, ipAddress: true, actorUser: { select: { id: true, name: true } }, organization: { select: { id: true, name: true } } }, orderBy: { occurredAt: 'desc' }, take: 100 }); }
  async system(user: AuthenticatedUserRef) { const actor = await this.access.resolve(user); this.requireGlobal(actor, 'settings:system:read'); return this.prisma.systemSetting.upsert({ where: { key: 'global' }, create: {}, update: {} }); }
  async updateSystem(dto: UpdateSystemSettingsDto, user: AuthenticatedUserRef) { const actor = await this.access.resolve(user); this.requireGlobal(actor, 'settings:system:update'); const before = await this.prisma.systemSetting.findUnique({ where: { key: 'global' } }); const after = await this.prisma.systemSetting.upsert({ where: { key: 'global' }, create: dto, update: dto }); await this.record(actor, 'settings.system.updated', 'SystemSetting', 'global', before, after); return after; }

  private capabilities(actor: AccessContext) { const role = this.roleCode(actor); return { role, level: ROLE_LEVEL[role], sections: actor.global ? ['account','organization','users','roles','security','notifications','branding','operations','integrations','audit','system'] : role === 'ORG_ADMIN' ? ['account','organization','users','roles','security','notifications','branding','operations','integrations','audit'] : role === 'MANAGER' ? ['account','users','roles','security','notifications','operations','integrations','audit'] : ['account','roles','security','notifications','audit'] }; }
  private roleCode(actor: AccessContext) { return actor.global ? 'GLOBAL_ADMIN' : actor.roles.includes('ORG_ADMIN') ? 'ORG_ADMIN' : actor.roles.includes('MANAGER') ? 'MANAGER' : 'BROKER'; }
  private organizationScope(actor: AccessContext, requested?: string) { const id = actor.global ? requested : actor.organizationId; if (!id) throw new ForbiddenException(actor.global ? 'Selecione uma organização' : 'Escopo organizacional inválido'); if (!actor.global && requested && requested !== actor.organizationId) throw new ForbiddenException('Operação entre organizações não permitida'); return id; }
  private require(actor: AccessContext, permission: string, alternative?: string) { if (actor.permissions.includes('*') || actor.permissions.includes(permission) || (alternative && actor.permissions.includes(alternative))) return; throw new ForbiddenException('Permissão insuficiente'); }
  private requireGlobal(actor: AccessContext, permission: string) { this.require(actor, permission); if (!actor.global) throw new ForbiddenException('Configuração exclusiva do administrador global'); }
  private async record(actor: AccessContext, action: string, entityType: string, entityId: string, before?: unknown, after?: unknown) { await this.auditService.record({ organizationId: actor.organizationId, actorUserId: actor.id, module: 'settings', entityType, entityId, action, before: this.json(before), after: this.json(after) }); }
  private json(value: unknown): Prisma.InputJsonValue | undefined { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }
}
