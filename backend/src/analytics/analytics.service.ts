import { ForbiddenException, Injectable } from '@nestjs/common';
import { AnalyticsEventSource, Prisma, Role } from '@prisma/client';
import { AccessContextService, AuthenticatedUserRef } from '../auth/access-context.service';
import { AnalyticsDomainEvent, ANALYTICS_EVENT_TYPES } from './analytics-domain-event';
import { AnalyticsQueryDto, EntityMetricsQueryDto } from './dto/analytics-query.dto';
import { RecordAnalyticsEventDto } from './dto/record-analytics-event.dto';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { PrismaService } from '../prisma/prisma.service';

type MetricModel = 'daily' | 'hourly' | 'campaign' | 'broker' | 'manager' | 'whatsapp';
type OverviewRow = { leads: number; campaigns: number; distributions: number; whatsappSent: number; whatsappRead: number; conversions: number };

@Injectable()
export class AnalyticsService {
  constructor(private readonly access: AccessContextService, private readonly repository: AnalyticsRepository, private readonly prisma: PrismaService) {}

  private async scopedOrganization(query: AnalyticsQueryDto, user: AuthenticatedUserRef) { const ctx=await this.access.resolve(user); const organizationId=ctx.global?query.organizationId:ctx.organizationId; if(!organizationId) throw new ForbiddenException('Organização obrigatória para consultar analytics'); return organizationId; }
  async executive(query:AnalyticsQueryDto,user:AuthenticatedUserRef){ const organizationId=await this.scopedOrganization(query,user); const [campaigns,metrics,temporal,recentEvents,operationalAlerts]=await Promise.all([this.prisma.campaign.groupBy({by:['status'],where:{organizationId,deletedAt:null},_count:true}),this.prisma.campaignMetric.aggregate({where:{organizationId},_sum:{sent:true,delivered:true,opened:true,clicked:true,failed:true,conversions:true}}),this.prisma.dailyMetric.findMany({where:{organizationId},orderBy:{bucketStart:'asc'},take:60}),this.prisma.analyticsEvent.findMany({where:{organizationId},orderBy:{occurredAt:'desc'},take:10,select:{id:true,eventType:true,source:true,occurredAt:true}}),this.prisma.messageQueue.findMany({where:{organizationId,status:'FAILED'},orderBy:{updatedAt:'desc'},take:10,select:{id:true,status:true,lastError:true,updatedAt:true}})]); const sum=metrics._sum,sent=sum.sent??0,delivered=sum.delivered??0,read=sum.opened??0,clicked=sum.clicked??0,conversions=sum.conversions??0,rate=(value:number)=>sent?value*100/sent:0,count=(statuses:string[])=>campaigns.filter(item=>statuses.includes(item.status)).reduce((total,item)=>total+item._count,0); return {campaigns:{active:count(['READY','SCHEDULED','QUEUED','RUNNING']),completed:count(['COMPLETED','COMPLETED_WITH_ERRORS']),paused:count(['PAUSED']),canceled:count(['CANCELED'])},messages:{contacts:sent,sent,delivered,read,clicked,failed:sum.failed??0},rates:{ctr:rate(clicked),readRate:rate(read),deliveryRate:rate(delivered),conversionRate:rate(conversions)},conversions,averageCampaignTimeMs:0,ranking:[],temporal,recentEvents,operationalAlerts}; }
  async events(query:EntityMetricsQueryDto,user:AuthenticatedUserRef){ const organizationId=await this.scopedOrganization(query,user),page=query.page??1,limit=query.limit??25,where={organizationId,...(query.campaignId?{campaignId:query.campaignId}:{}),...(query.from||query.to?{occurredAt:{...(query.from?{gte:new Date(query.from)}:{}),...(query.to?{lte:new Date(query.to)}:{})}}:{})}; const [items,total]=await this.prisma.$transaction([this.prisma.analyticsEvent.findMany({where,orderBy:{occurredAt:'desc'},skip:(page-1)*limit,take:limit}),this.prisma.analyticsEvent.count({where})]); return {items,pagination:{page,limit,total,pages:Math.ceil(total/limit)}}; }
  async templates(query:AnalyticsQueryDto,user:AuthenticatedUserRef){ const organizationId=await this.scopedOrganization(query,user); const items=await this.prisma.whatsappTemplate.findMany({where:{organizationId,deletedAt:null},orderBy:{updatedAt:'desc'}}); return items.map(item=>({id:item.id,name:item.displayName||item.name,campaigns:0,used:0,sent:0,delivered:0,read:0,clicked:0,conversions:0,lastUsedAt:item.updatedAt,ctr:0,deliveryRate:0,readRate:0,conversionRate:0})); }
  async funnel(campaignId:string,query:AnalyticsQueryDto,user:AuthenticatedUserRef){ const organizationId=await this.scopedOrganization(query,user); const campaign=await this.prisma.campaign.findFirst({where:{id:campaignId,organizationId,deletedAt:null},select:{id:true,name:true}}); if(!campaign) throw new ForbiddenException('Campanha não encontrada'); const totals=await this.prisma.campaignMetric.aggregate({where:{campaignId,organizationId},_sum:{sent:true,delivered:true,opened:true,clicked:true,conversions:true}}),values=[['sent','Enviadas',totals._sum.sent??0],['delivered','Entregues',totals._sum.delivered??0],['read','Lidas',totals._sum.opened??0],['clicked','Cliques',totals._sum.clicked??0],['conversions','Conversões',totals._sum.conversions??0]] as const,base=values[0][2],stages=values.map((entry,index)=>({key:entry[0],label:entry[1],value:entry[2],stepRate:index&&values[index-1][2]?entry[2]*100/values[index-1][2]:100,cumulativeRate:base?entry[2]*100/base:0,abandonment:index?Math.max(0,values[index-1][2]-entry[2]):0})); return {campaign,stages,bottleneck:stages.slice(1).sort((a,b)=>b.abandonment-a.abandonment)[0]??null,averageDeliveryTimeMs:0,averageReadTimeMs:0}; }

  daily(query: AnalyticsQueryDto, user: AuthenticatedUserRef) { return this.metrics('daily', query, user); }
  hourly(query: AnalyticsQueryDto, user: AuthenticatedUserRef) { return this.metrics('hourly', query, user); }
  campaigns(query: EntityMetricsQueryDto, user: AuthenticatedUserRef) { return this.metrics('campaign', query, user, query.campaignId ? { campaignId: query.campaignId } : {}); }
  brokers(query: EntityMetricsQueryDto, user: AuthenticatedUserRef) { return this.metrics('broker', query, user, query.userId ? { brokerUserId: query.userId } : {}); }
  managers(query: EntityMetricsQueryDto, user: AuthenticatedUserRef) { return this.metrics('manager', query, user, query.userId ? { managerUserId: query.userId } : {}); }
  whatsapp(query: EntityMetricsQueryDto, user: AuthenticatedUserRef) { return this.metrics('whatsapp', query, user, query.whatsappAccountId ? { whatsappAccountId: query.whatsappAccountId } : {}); }

  async overview(query: AnalyticsQueryDto, user: AuthenticatedUserRef) {
    const rows = await this.daily(query, user) as OverviewRow[];
    return { interval: { from: query.from ?? null, to: query.to ?? null }, leads: this.sum(rows, 'leads'), campaigns: this.sum(rows, 'campaigns'), distributions: this.sum(rows, 'distributions'), whatsappSent: this.sum(rows, 'whatsappSent'), whatsappRead: this.sum(rows, 'whatsappRead'), conversions: this.sum(rows, 'conversions') };
  }

  async recordEvent(data: RecordAnalyticsEventDto) {
    const event: AnalyticsDomainEvent = { organizationId: data.organizationId, source: data.source.toUpperCase() as AnalyticsEventSource, eventType: data.eventType, occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(), idempotencyKey: data.idempotencyKey ?? `${data.eventType}:${data.organizationId}:${data.occurredAt ?? Date.now()}`, leadId: data.leadId, campaignId: data.campaignId, brokerUserId: data.brokerUserId, managerUserId: data.managerUserId, whatsappAccountId: data.whatsappAccountId, distributionId: data.distributionId, dealId: data.dealId, metadata: data.metadata };
    return this.recordDomainEvent(event);
  }

  async recordDomainEvent(event: AnalyticsDomainEvent) {
    if (!event.organizationId || !ANALYTICS_EVENT_TYPES.includes(event.eventType)) throw new ForbiddenException('Evento de analytics inválido');
    try { return await this.repository.createEvent(event); }
    catch (error) { if (this.isUniqueConflict(error)) return { duplicate: true, idempotencyKey: event.idempotencyKey }; throw error; }
  }

  private async metrics(model: MetricModel, query: AnalyticsQueryDto, user: AuthenticatedUserRef, extra: Record<string, string> = {}) {
    const ctx = await this.access.resolve(user);
    const organizationId = ctx.global ? query.organizationId : ctx.organizationId;
    if (!organizationId || (!ctx.global && organizationId !== ctx.organizationId)) throw new ForbiddenException('Organização obrigatória para consultar analytics');
    if (ctx.role === Role.BROKER && model === 'broker' && extra.brokerUserId && extra.brokerUserId !== ctx.id) throw new ForbiddenException('Corretor só pode consultar os próprios indicadores');
    const scopedExtra = ctx.role === Role.BROKER && model === 'broker' && !extra.brokerUserId ? { brokerUserId: ctx.id } : extra;
    const bucketStart = query.from || query.to ? { ...(query.from ? { gte: new Date(query.from) } : {}), ...(query.to ? { lte: new Date(query.to) } : {}) } : undefined;
    if (model === 'daily') return this.repository.listDaily({ organizationId, ...(bucketStart ? { bucketStart } : {}) }, query);
    if (model === 'hourly') return this.repository.listHourly({ organizationId, ...(bucketStart ? { bucketStart } : {}) }, query);
    if (model === 'campaign') return this.repository.listCampaign({ organizationId, ...scopedExtra, ...(bucketStart ? { bucketStart } : {}) }, query as EntityMetricsQueryDto);
    if (model === 'broker') return this.repository.listBroker({ organizationId, ...scopedExtra, ...(bucketStart ? { bucketStart } : {}) }, query as EntityMetricsQueryDto);
    if (model === 'manager') return this.repository.listManager({ organizationId, ...scopedExtra, ...(bucketStart ? { bucketStart } : {}) }, query as EntityMetricsQueryDto);
    return this.repository.listWhatsapp({ organizationId, ...scopedExtra, ...(bucketStart ? { bucketStart } : {}) }, query as EntityMetricsQueryDto);
  }

  private sum(rows: OverviewRow[], key: keyof OverviewRow) { return rows.reduce((total, row) => total + row[key], 0); }
  private isUniqueConflict(error: unknown) { return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'; }
}
