import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AccessContextService } from '../auth/access-context.service';
import { PrismaService } from '../prisma/prisma.service';

const preferenceKeys = ['avatarUrl','language','timezone','dateFormat','notifyInApp','notifyEmail','notifyWhatsapp','notifyNewLeads','notifySla','notifyCampaigns','notifySecurity'] as const;
const brandingKeys = ['displayName','logoUrl','faviconUrl','primaryColor','secondaryColor','signature','footer'] as const;
const operationKeys = ['businessStartsAt','businessEndsAt','dailyLeadLimit','slaMinutes','contactAttempts','redistributionMinutes','roundRobin','notifyLeadFailures','notifyWhatsappHealth'] as const;
const securityKeys = ['sessionTtlMinutes','maxLoginAttempts'] as const;

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService, private readonly access: AccessContextService) {}

  private async context(userId: string) { return this.access.resolve({ id: userId }); }
  private pick(body: Record<string, unknown>, keys: readonly string[]) { return Object.fromEntries(keys.filter(key => body[key] !== undefined).map(key => [key, body[key]])); }
  private async orgId(userId: string) { const ctx = await this.context(userId); if (!ctx.organizationId) throw new ForbiddenException('Contexto de organização obrigatório'); return ctx.organizationId; }
  private async organizationSetting(organizationId: string) { return this.prisma.organizationSetting.upsert({ where: { organizationId }, update: {}, create: { organizationId } }); }

  async me(userId: string) {
    const ctx = await this.context(userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id:true,name:true,email:true,phone:true,role:true,organizationId:true,organization:{select:{id:true,name:true}},createdAt:true,updatedAt:true,settings:true,authSessions:{where:{revokedAt:null},select:{id:true,createdAt:true,lastAccessedAt:true,expiresAt:true,device:true,ipAddress:true},orderBy:{createdAt:'desc'},take:10} } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    const sections = ctx.global ? ['account','organization','users','roles','security','notifications','branding','operations','integrations','audit','system'] : ctx.role === 'BROKER' || ctx.role === 'CORRETOR' ? ['account','security','notifications','integrations','audit'] : ['account','organization','users','roles','security','notifications','branding','operations','integrations','audit'];
    return { ...user, businessRole: ctx.global ? 'GLOBAL_ADMIN' : ctx.role === 'ADMIN' || ctx.role === 'ORG_ADMIN' ? 'ORG_ADMIN' : ctx.role === 'MANAGER' ? 'MANAGER' : 'BROKER', permissions: ctx.permissions, capabilities: { role: ctx.role, level: ctx.global ? 4 : ctx.role === 'MANAGER' ? 2 : 1, sections } };
  }

  async updateMe(userId: string, body: Record<string, unknown>) {
    await this.context(userId);
    const name = typeof body.name === 'string' ? body.name.trim() : undefined;
    if (name !== undefined && !name) throw new BadRequestException('Nome é obrigatório');
    await this.prisma.$transaction([
      this.prisma.user.update({ where:{id:userId}, data:{ name, phone: typeof body.phone === 'string' ? body.phone.trim() || null : undefined } }),
      this.prisma.userPreference.upsert({ where:{userId}, update:this.pick(body, preferenceKeys), create:{userId,...this.pick(body, preferenceKeys)} }),
    ]);
    return this.me(userId);
  }

  async organization(userId: string) { const organizationId = await this.orgId(userId); const item = await this.prisma.organization.findUnique({ where:{id:organizationId}, include:{settings:true} }); if (!item) throw new NotFoundException('Organização não encontrada'); return item; }
  async updateOrganization(userId: string, body: Record<string, unknown>) { const organizationId=await this.orgId(userId); await this.prisma.organization.update({where:{id:organizationId},data:this.pick(body,['name','legalName','document','email','phone','timezone','locale'])}); return this.organization(userId); }
  async organizationSettings(userId: string) { return this.organizationSetting(await this.orgId(userId)); }
  async updateOrganizationSettings(userId:string, body:Record<string,unknown>, area:'branding'|'operations') { const organizationId=await this.orgId(userId); const data=this.pick(body,area==='branding'?brandingKeys:operationKeys); return this.prisma.organizationSetting.upsert({where:{organizationId},update:data,create:{organizationId,...data}}); }
  async security(userId:string) { const ctx=await this.context(userId); const settings=ctx.organizationId ? await this.organizationSetting(ctx.organizationId) : null; return { sessionTtlMinutes:settings?.sessionTtlMinutes ?? 480,maxLoginAttempts:settings?.maxLoginAttempts ?? 5,sessions:(await this.me(userId)).authSessions }; }
  async updateSecurity(userId:string,body:Record<string,unknown>) { const organizationId=await this.orgId(userId); const data=this.pick(body,securityKeys); return this.prisma.organizationSetting.upsert({where:{organizationId},update:data,create:{organizationId,...data}}); }
  async updateNotifications(userId:string,body:Record<string,unknown>) { await this.prisma.userPreference.upsert({where:{userId},update:this.pick(body,preferenceKeys),create:{userId,...this.pick(body,preferenceKeys)}}); return this.me(userId); }
  async permissions(userId:string) { const ctx=await this.context(userId); const roles=await this.prisma.rbacRole.findMany({where:{deletedAt:null,OR:[{organizationId:ctx.organizationId},{organizationId:null}]},include:{permissions:{include:{permission:true}}},orderBy:{code:'asc'}}); return {actorRole:ctx.role,editable:ctx.global||ctx.role==='ADMIN'||ctx.role==='ORG_ADMIN',businessLabels:{GLOBAL_ADMIN:'Administrador geral',ORG_ADMIN:'Superintendente',MANAGER:'Gerente',BROKER:'Corretor'},reserved:['GLOBAL_ADMIN'],roles}; }
  async integrations(userId:string) { const ctx=await this.context(userId); const org=ctx.organizationId; const [whatsapp,campaigns]=org?await Promise.all([this.prisma.whatsappAccount.count({where:{organizationId:org,deletedAt:null,status:'ACTIVE'}}),this.prisma.campaign.count({where:{organizationId:org,deletedAt:null}})]):[0,0]; return {scope:org,diagnosticsVisible:ctx.global,secretsExposed:false,items:[{id:'meta',name:'WhatsApp Meta',status:whatsapp?'connected':'not_connected',health:whatsapp?'healthy':'unknown',href:'/whatsapp'},{id:'campaigns',name:'Campanhas',status:campaigns?'connected':'available',health:'healthy',href:'/campaigns'}]}; }
  async audit(userId:string) { const ctx=await this.context(userId); return this.prisma.auditLog.findMany({where:ctx.global?{}:{organizationId:ctx.organizationId},select:{id:true,occurredAt:true,module:true,action:true,entityType:true,entityId:true,ipAddress:true,actorUser:{select:{id:true,name:true}},organization:{select:{id:true,name:true}}},orderBy:{occurredAt:'desc'},take:100}); }
  async system(userId:string) { const ctx=await this.context(userId); const current=await this.prisma.systemSetting.upsert({where:{key:'global'},update:{},create:{key:'global'}}); return {...current,editable:ctx.global}; }
  async updateSystem(userId:string,body:Record<string,unknown>) { const ctx=await this.context(userId); if(!ctx.global) throw new ForbiddenException('Apenas administradores gerais podem alterar o sistema'); return this.prisma.systemSetting.upsert({where:{key:'global'},update:this.pick(body,['defaultSessionMinutes','defaultLeadLimit','maintenanceMode','allowOrganizationBranding']),create:{key:'global',...this.pick(body,['defaultSessionMinutes','defaultLeadLimit','maintenanceMode','allowOrganizationBranding'])}}); }
}
