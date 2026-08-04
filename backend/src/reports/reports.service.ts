import { BadRequestException, Injectable } from '@nestjs/common';
import { AccessContextService } from '../auth/access-context.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService, private readonly access: AccessContextService) {}
  private cell(value: unknown) { const text=String(value ?? ''); const safe=/^[=+\-@]/.test(text)?`'${text}`:text; return `"${safe.replace(/"/g,'""')}"`; }
  private csv(headers:string[], rows:unknown[][]) { return `\uFEFF${headers.map(value=>this.cell(value)).join(',')}\r\n${rows.map(row=>row.map(value=>this.cell(value)).join(',')).join('\r\n')}`; }
  async exportCsv(userId:string, query:Record<string,string>) {
    const ctx=await this.access.resolve({id:userId});
    const where={...(ctx.global?{}:{organizationId:ctx.organizationId!}),...(query.from||query.to?{createdAt:{...(query.from?{gte:new Date(query.from)}:{}),...(query.to?{lte:new Date(`${query.to}T23:59:59.999Z`)}:{})}}:{})};
    if(query.dataset==='events') { const items=await this.prisma.analyticsEvent.findMany({where:{...where,...(query.campaignId?{campaignId:query.campaignId}:{}),...(query.status?{eventType:query.status}:{}),...(query.brokerId?{brokerUserId:query.brokerId}:{}),...(query.managerId?{managerUserId:query.managerId}:{})},orderBy:{occurredAt:'desc'},take:10000}); return this.csv(['id','tipo','origem','campanha','corretor','gerente','data'],items.map(item=>[item.id,item.eventType,item.source,item.campaignId,item.brokerUserId,item.managerUserId,item.occurredAt.toISOString()])); }
    if(query.dataset==='conversions') { const items=await this.prisma.analyticsEvent.findMany({where:{...where,eventType:{contains:'CONVERSION'},...(query.campaignId?{campaignId:query.campaignId}:{})},orderBy:{occurredAt:'desc'},take:10000}); return this.csv(['id','campanha','lead','corretor','data'],items.map(item=>[item.id,item.campaignId,item.leadId,item.brokerUserId,item.occurredAt.toISOString()])); }
    if(query.dataset!=='campaigns') throw new BadRequestException('Relatório inválido');
    const items=await this.prisma.campaign.findMany({where:{...where,deletedAt:null,...(query.campaignId?{id:query.campaignId}:{}),...(query.status?{status:query.status as never}:{})},include:{_count:{select:{recipients:true}}},orderBy:{createdAt:'desc'},take:10000});
    return this.csv(['id','nome','status','tipo','destinatários','agendada','criada'],items.map(item=>[item.id,item.name,item.status,item.campaignType,item._count.recipients,item.scheduledAt?.toISOString(),item.createdAt.toISOString()]));
  }
}
