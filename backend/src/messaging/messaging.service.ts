import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MessageQueue, Prisma, Priority, QueueStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MetaWhatsappClient } from '../whatsapp/meta/meta-whatsapp.client';
import { WhatsappCredentialCryptoService } from '../whatsapp/security/credential-crypto.service';
import { CreateMessageQueueDto } from './dto/create-message-queue.dto';
import { ListMessageLogsDto } from './dto/list-message-logs.dto';
import { ListMessageQueuesDto } from './dto/list-message-queues.dto';
import { classifyMetaError } from './meta-error-classifier';
import { createHash, createHmac } from 'crypto';
import { readFile } from 'fs/promises';
import { basename, resolve, sep } from 'path';
import { detectMediaMime, normalizeBrazilianPhone } from '../campaigns/campaign-preparation';
import { parseMetaTemplateComponents } from '../whatsapp/templates/template-components';
import { dynamicUrlSuffix, mediaHeader, weightedAgentAt } from './campaign-runtime';

const priorityRank: Record<Priority, number> = { LOW: 1, NORMAL: 2, HIGH: 3, URGENT: 4 };
const activeStatuses: QueueStatus[] = ['PENDING', 'WAITING', 'PROCESSING', 'RETRYING'];
export const CAMPAIGN_OPERATION_LIMITS={batchSize:Number(process.env.CAMPAIGN_BATCH_SIZE||100),maxPendingJobs:Number(process.env.CAMPAIGN_MAX_PENDING_JOBS||1000),processingTimeoutMs:Number(process.env.CAMPAIGN_PROCESSING_TIMEOUT_MS||900000),reconcileLimit:Number(process.env.CAMPAIGN_RECONCILE_LIMIT||50)} as const;

type QueuePayload = {
  type?: string;
  to?: string;
  text?: string;
  contacts?: { displayName: string; phoneE164: string }[];
  distributionId?: string;
};

type VariableMapping = { component:'HEADER'|'BODY'|'BUTTON'; position:number; buttonIndex?:number; sourceType:'COLUMN'|'FIXED'|'LEAD_NAME'|'LEAD_PHONE'; sourceColumn?:string; fixedValue?:string };

type WhatsappAccountForQueue = {
  id: string;
  organizationId: string;
  accessToken: string;
  phoneNumberId: string;
  normalizedPhone: string;
  apiVersion:string|null;
};

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meta: MetaWhatsappClient,
    private readonly crypto: WhatsappCredentialCryptoService,
  ) {}

  async sendCampaignTest(userId:string,organizationId:string,campaignId:string,data:{phone:string;idempotencyKey:string;values?:Array<{component:string;position:number;buttonIndex?:number;value:string}>}){
    const normalized=normalizeBrazilianPhone(data.phone);if(!normalized.phone)throw new BadRequestException('TEST_RECIPIENT_INVALID');
    const campaign=await this.prisma.campaign.findFirst({where:{id:campaignId,organizationId,deletedAt:null},include:{whatsappTemplate:true}});if(!campaign)throw new NotFoundException('Campanha não encontrada');if(campaign.status!=='DRAFT')throw new BadRequestException('TEST_CAMPAIGN_NOT_DRAFT');if(!campaign.whatsappAccountId||!campaign.whatsappTemplate)throw new BadRequestException('TEST_CAMPAIGN_INCOMPLETE');
    const template=campaign.whatsappTemplate;if(template.status!=='APPROVED'||!template.isActive||template.deletedAt||template.archivedAt||!template.metaTemplateId)throw new BadRequestException('WHATSAPP_TEMPLATE_NOT_APPROVED');
    const parsed=parseMetaTemplateComponents(template.components),provided=new Map((data.values||[]).map(v=>[`${v.component}:${v.position}:${v.buttonIndex??''}`,v.value.trim()]));if(parsed.variables.some(v=>!provided.get(`${v.component}:${v.position}:${v.buttonIndex??''}`)))throw new BadRequestException('TEST_VARIABLE_REQUIRED');
    const key=createHash('sha256').update(`${organizationId}:${campaignId}:${userId}:${data.idempotencyKey}`).digest('hex');const duplicate=await this.prisma.auditLog.findFirst({where:{organizationId,entityId:campaignId,action:'campaign.test.sent',metadata:{path:['idempotencyKey'],equals:key}}});if(duplicate)return{sent:true,duplicate:true};
    const recent=await this.prisma.auditLog.count({where:{organizationId,actorUserId:userId,action:'campaign.test.sent',occurredAt:{gte:new Date(Date.now()-60_000)}}});if(recent>=5)throw new BadRequestException('TEST_RATE_LIMITED');
    const account=await this.prisma.whatsappAccount.findFirst({where:{id:campaign.whatsappAccountId,organizationId,provider:'META_CLOUD',status:'ACTIVE',tokenConfigured:true,deletedAt:null}}) as WhatsappAccountForQueue|null;if(!account)throw new BadRequestException('WHATSAPP_ACCOUNT_UNAVAILABLE');
    const groups=new Map<string,{type:string;index?:string;parameters:Array<{type:string;text:string}>}>();for(const variable of parsed.variables){const mapKey=`${variable.component}:${variable.position}:${variable.buttonIndex??''}`,value=provided.get(mapKey)!;const groupKey=variable.component==='BUTTON'?`button:${variable.buttonIndex}`:variable.component.toLowerCase();if(!groups.has(groupKey))groups.set(groupKey,{type:variable.component.toLowerCase(),...(variable.component==='BUTTON'?{index:String(variable.buttonIndex)}:{}),parameters:[]});groups.get(groupKey)!.parameters.push({type:'text',text:value})}
    try{const result=await this.meta.sendTemplate({accessToken:this.crypto.decrypt(account.accessToken),phoneNumberId:account.phoneNumberId,to:normalized.phone,name:template.metaName,language:template.language,components:[...groups.values()]});await this.prisma.auditLog.create({data:{organizationId,actorUserId:userId,module:'campaigns',entityType:'Campaign',entityId:campaignId,action:'campaign.test.sent',after:{status:'SENT'},metadata:{idempotencyKey:key,providerMessageIdHash:createHash('sha256').update(result.externalMessageId).digest('hex')}}});return{sent:true,duplicate:false}}catch(error){const classified=classifyMetaError(error);await this.prisma.auditLog.create({data:{organizationId,actorUserId:userId,module:'campaigns',entityType:'Campaign',entityId:campaignId,action:'campaign.test.failed',after:{category:classified.category},metadata:{idempotencyKey:key}}});throw new BadRequestException({code:classified.category,message:classified.message})}
  }

  async enqueueCampaign(userId: string, data: CreateMessageQueueDto) {
    const organizationId = await this.getOrganizationId(userId);
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: data.campaignId, organizationId, deletedAt: null },
      include: { recipients: true },
    });
    if (!campaign) throw new NotFoundException('Campanha não encontrada');
    if (!data.recipients?.length && !campaign.recipients.length) throw new BadRequestException('Campanha sem destinatários');
    return this.enqueueRecipients(organizationId, data, campaign.recipients);
  }

  async enqueueRecipients(organizationId: string, data: CreateMessageQueueDto, campaignRecipients: { id: string; phone: string; name: string | null }[] = []) {
    const recipients = data.recipients?.length ? data.recipients : campaignRecipients.map((recipient) => ({ recipientId: recipient.id }));
    const created = await this.prisma.$transaction(async (tx) => {
      const result = await Promise.all(recipients.map((recipient) => tx.messageQueue.create({
        data: {
          organizationId,
          campaignId: data.campaignId,
          recipientId: recipient.recipientId ?? null,
          whatsappAccountId: recipient.whatsappAccountId ?? data.whatsappAccountId ?? null,
          status: 'PENDING',
          priority: recipient.priority ?? data.priority ?? 'NORMAL',
          maxAttempts: recipient.maxAttempts ?? data.maxAttempts ?? 3,
          scheduledAt: recipient.scheduledAt ? new Date(recipient.scheduledAt) : data.scheduledAt ? new Date(data.scheduledAt) : new Date(),
          payload: (recipient.payload ?? data.payload ?? {}) as Prisma.InputJsonValue,
        },
      })));
      await Promise.all(result.map((queue) => tx.messageLog.create({ data: { queueId: queue.id, campaignId: queue.campaignId, recipientId: queue.recipientId, status: 'PENDING', message: 'Mensagem adicionada à fila' } })));
      return result;
    });
    return { items: created, count: created.length };
  }

  async feedCampaign(campaignId:string,organizationId:string){const campaign=await this.prisma.campaign.findFirst({where:{id:campaignId,organizationId,deletedAt:null,status:{in:['QUEUED','RUNNING']}},select:{id:true,whatsappAccountId:true,status:true}});if(!campaign?.whatsappAccountId)return{created:0,reason:'CAMPAIGN_NOT_ACTIVE'};const pendingJobs=await this.prisma.messageQueue.count({where:{campaignId,organizationId,status:{in:['PENDING','WAITING','PROCESSING','RETRYING']}}});const capacity=Math.max(0,CAMPAIGN_OPERATION_LIMITS.maxPendingJobs-pendingJobs);if(!capacity)return{created:0,reason:'BACKPRESSURE'};const now=new Date();const recipients=await this.prisma.campaignRecipient.findMany({where:{campaignId,organizationId,externalMessageId:null,OR:[{status:'PENDING'},{status:'FAILED_RETRYABLE',nextRetryAt:{lte:now}}]},select:{id:true,phone:true},orderBy:{id:'asc'},take:Math.min(capacity,CAMPAIGN_OPERATION_LIMITS.batchSize)});if(!recipients.length)return{created:0,reason:'NO_ELIGIBLE_RECIPIENTS'};const ids=recipients.map(r=>r.id);await this.prisma.messageQueue.updateMany({where:{campaignId,organizationId,recipientId:{in:ids},status:'FAILED'},data:{status:'RETRYING',scheduledAt:now,finishedAt:null,lastError:null}});const created=await this.prisma.messageQueue.createMany({skipDuplicates:true,data:recipients.map(r=>({organizationId,campaignId,recipientId:r.id,whatsappAccountId:campaign.whatsappAccountId,status:'PENDING',maxAttempts:Number(process.env.CAMPAIGN_MAX_ATTEMPTS||4),payload:{type:'TEMPLATE',to:r.phone} as Prisma.InputJsonValue}))});await this.prisma.campaignRecipient.updateMany({where:{id:{in:ids},organizationId,campaignId,status:{in:['PENDING','FAILED_RETRYABLE']},externalMessageId:null},data:{status:'QUEUED',queuedAt:now}});await this.prisma.campaign.update({where:{id:campaignId},data:{totalQueued:await this.prisma.campaignRecipient.count({where:{campaignId,organizationId,status:{in:['QUEUED','PROCESSING']}}})}});return{created:created.count,reason:null};}

  async reconcileOperational(){const now=new Date(),stale=new Date(now.getTime()-CAMPAIGN_OPERATION_LIMITS.processingTimeoutMs);await this.prisma.campaign.updateMany({where:{mediaUploadStatus:'UPLOADING',updatedAt:{lt:stale}},data:{mediaUploadStatus:'FAILED_RETRYABLE',mediaExpiresAt:now,mediaUploadError:'Lock de upload expirado antes da confirmação da Meta'}});const scheduled=await this.prisma.campaign.findMany({where:{status:'SCHEDULED',scheduledAt:{lte:now},deletedAt:null,archivedAt:null},select:{id:true,organizationId:true,whatsappAccountId:true,whatsappTemplateId:true,listConfirmedAt:true,reviewedAt:true},take:CAMPAIGN_OPERATION_LIMITS.reconcileLimit});for(const c of scheduled){const valid=!!c.whatsappAccountId&&!!c.whatsappTemplateId&&!!c.listConfirmedAt&&!!c.reviewedAt&&await this.prisma.whatsappAccount.count({where:{id:c.whatsappAccountId,organizationId:c.organizationId,provider:'META_CLOUD',status:'ACTIVE',tokenConfigured:true,deletedAt:null}})>0&&await this.prisma.whatsappTemplate.count({where:{id:c.whatsappTemplateId,organizationId:c.organizationId,whatsappAccountId:c.whatsappAccountId,status:'APPROVED',isActive:true,deletedAt:null,archivedAt:null}})>0;await this.prisma.campaign.updateMany({where:{id:c.id,organizationId:c.organizationId,status:'SCHEDULED'},data:{status:valid?'QUEUED':'FAILED',startedAt:valid?now:undefined,finishedAt:valid?undefined:now}});if(valid)await this.feedCampaign(c.id,c.organizationId);}const stuck=await this.prisma.campaignRecipient.findMany({where:{status:'PROCESSING',processingAt:{lt:stale}},select:{id:true,organizationId:true,campaignId:true,externalMessageId:true,attemptCount:true},take:CAMPAIGN_OPERATION_LIMITS.reconcileLimit});for(const r of stuck){if(r.externalMessageId){await this.prisma.campaignRecipient.updateMany({where:{id:r.id,status:'PROCESSING'},data:{status:'UNKNOWN',errorCategory:'UNKNOWN',errorMessage:'Envio aceito, aguardando reconciliação manual'}});await this.prisma.messageQueue.updateMany({where:{campaignId:r.campaignId,recipientId:r.id,status:'PROCESSING'},data:{status:'FAILED',finishedAt:now,lastError:'Estado incerto: Meta pode ter aceitado a mensagem'}});}else await this.prisma.campaignRecipient.updateMany({where:{id:r.id,status:'PROCESSING',externalMessageId:null},data:{status:'FAILED_RETRYABLE',nextRetryAt:now,errorCategory:'RETRYABLE_TIMEOUT',errorMessage:'Lock de processamento expirado'}});}await this.prisma.messageQueue.updateMany({where:{status:'PROCESSING',startedAt:{lt:stale},recipient:{externalMessageId:null}},data:{status:'RETRYING',scheduledAt:now,lastError:'Lock de processamento expirado'}});const active=await this.prisma.campaign.findMany({where:{status:{in:['QUEUED','RUNNING']},deletedAt:null},select:{id:true,organizationId:true},take:CAMPAIGN_OPERATION_LIMITS.reconcileLimit});for(const c of active){await this.feedCampaign(c.id,c.organizationId);await this.recalculateCampaign(c.id,c.organizationId);await this.reconcileCampaign(c.id,c.organizationId);}return{scheduled:scheduled.length,stuck:stuck.length,active:active.length};}

  async findAll(userId: string, query: ListMessageQueuesDto) {
    const organizationId = await this.getOrganizationId(userId);
    const page = query.page ?? 1, limit = query.limit ?? 10;
    const where: Prisma.MessageQueueWhereInput = { organizationId, ...(query.status ? { status: query.status } : {}), ...(query.priority ? { priority: query.priority } : {}), ...(query.campaignId ? { campaignId: query.campaignId } : {}), ...(query.whatsappAccountId ? { whatsappAccountId: query.whatsappAccountId } : {}), ...(query.search ? { OR: [{ campaign: { name: { contains: query.search, mode: 'insensitive' } } }, { lastError: { contains: query.search, mode: 'insensitive' } }] } : {}) };
    const [items, total, grouped] = await this.prisma.$transaction([
      this.prisma.messageQueue.findMany({ where, include: { campaign: { select: { id: true, name: true } }, recipient: { select: { id: true, name: true, phone: true } } }, orderBy: [{ priority: 'desc' }, { scheduledAt: 'asc' }], skip: (page - 1) * limit, take: limit }),
      this.prisma.messageQueue.count({ where }),
      this.prisma.messageQueue.groupBy({ by: ['status'], where: { organizationId }, _count: { _all: true }, orderBy: { status: 'asc' } }),
    ]);
    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) }, summary: grouped.reduce((acc, item) => ({ ...acc, [item.status]: ((item as { _count: { _all: number } })._count._all ?? 0) }), {} as Record<string, number>) };
  }

  async findOne(userId: string, id: string) { return this.getQueue(userId, id); }
  async startQueue(userId: string, id: string) { return this.updateStatus(userId, id, 'PENDING', 'Fila iniciada'); }
  async pauseQueue(userId: string, id: string) { return this.updateStatus(userId, id, 'WAITING', 'Fila pausada'); }
  async resumeQueue(userId: string, id: string) { return this.updateStatus(userId, id, 'PENDING', 'Fila retomada'); }
  async cancelQueue(userId: string, id: string) { return this.updateStatus(userId, id, 'CANCELED', 'Fila cancelada', { finishedAt: new Date() }); }
  async retryFailed(userId: string, id: string) { return this.updateStatus(userId, id, 'RETRYING', 'Falha reenfileirada para reprocessamento', { lastError: null }); }

  async processNext() {
    const now = new Date();
    const candidates = await this.prisma.messageQueue.findMany({ where: { status: { in: ['PENDING', 'RETRYING'] }, scheduledAt: { lte: now } }, take: 20, orderBy: [{ scheduledAt: 'asc' }] });
    const next = candidates.sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority] || a.scheduledAt.getTime() - b.scheduledAt.getTime())[0];
    if (!next) return null;

    const claimed = await this.prisma.messageQueue.updateMany({ where: { id: next.id, status: { in: ['PENDING', 'RETRYING'] } }, data: { status: 'PROCESSING', startedAt: now, attempt: { increment: 1 } } });
    if (!claimed.count) return null;

    const queue = await this.prisma.messageQueue.findUniqueOrThrow({ where: { id: next.id } });
    const campaign=await this.prisma.campaign.findFirst({where:{id:queue.campaignId,organizationId:queue.organizationId,deletedAt:null}});
    if(!campaign||campaign.status==='PAUSED'||campaign.status==='CANCELED'){await this.prisma.messageQueue.update({where:{id:queue.id},data:{status:campaign?.status==='CANCELED'?'CANCELED':'WAITING'}});return null;}
    if(['QUEUED','SCHEDULED'].includes(campaign.status))await this.prisma.campaign.update({where:{id:campaign.id},data:{status:'RUNNING',startedAt:campaign.startedAt||now}});
    if(queue.recipientId){const lock=await this.prisma.campaignRecipient.updateMany({where:{id:queue.recipientId,organizationId:queue.organizationId,status:{in:['QUEUED','FAILED_RETRYABLE']},externalMessageId:null},data:{status:'PROCESSING',processingAt:now,lastAttemptAt:now,attemptCount:{increment:1}}});if(!lock.count){await this.prisma.messageQueue.update({where:{id:queue.id},data:{status:'CANCELED',finishedAt:now}});return null;}}
    await this.registerLog(queue, 'PROCESSING', `Tentativa ${next.attempt + 1} iniciada`);

    try {
      const sent = await this.sendQueue(queue);
      return this.markSuccess(queue.id, `Mensagem aceita pela Meta (${sent.externalMessageId})`, { externalMessageId: sent.externalMessageId });
    } catch (error) {
      return this.markFailure(queue.id, error instanceof Error ? error.message : String(error));
    }
  }

  private async sendQueue(queue: MessageQueue) {
    const payload = queue.payload as QueuePayload;
    if (!queue.whatsappAccountId) throw new Error('Fila sem conta WhatsApp vinculada');
    const account = await this.prisma.whatsappAccount.findFirst({ where: { id: queue.whatsappAccountId, organizationId: queue.organizationId, provider:'META_CLOUD', status:'ACTIVE', tokenConfigured:true, deletedAt: null } }) as WhatsappAccountForQueue | null;
    if (!account) throw new Error('Conta WhatsApp não encontrada para a fila');
    if (!payload.to) throw new Error('Fila sem destinatário WhatsApp');

    const accessToken = this.crypto.decrypt(account.accessToken);
    const to = payload.to.replace('+', '');
    const result = payload.type === 'TEXT'
      ? await this.meta.sendText({ accessToken, phoneNumberId: account.phoneNumberId, to, text: payload.text ?? '' })
      : payload.type === 'CONTACTS'
        ? await this.meta.sendContacts({ accessToken, phoneNumberId: account.phoneNumberId, to, contacts: payload.contacts ?? [] })
        : payload.type === 'TEMPLATE'
          ? await this.sendCampaignTemplate(queue,account,payload.to,accessToken)
          : await Promise.reject(new Error(`Tipo de mensagem não suportado pela fila: ${payload.type ?? 'UNKNOWN'}`));

    await this.recordWhatsappMessage(queue, account, payload, result.externalMessageId);
    return result;
  }

  private async sendCampaignTemplate(queue:MessageQueue,account:WhatsappAccountForQueue,to:string,accessToken:string){
    const c=await this.prisma.campaign.findFirst({where:{id:queue.campaignId,organizationId:queue.organizationId,whatsappAccountId:account.id},include:{whatsappTemplate:true}});
    let r=queue.recipientId?await this.prisma.campaignRecipient.findFirst({where:{id:queue.recipientId,campaignId:queue.campaignId,organizationId:queue.organizationId}}):null;
    if(!c?.whatsappTemplate||!r||c.whatsappTemplate.status!=='APPROVED'||!c.whatsappTemplate.metaTemplateId)throw new Error('CAMPAIGN_TEMPLATE_UNAVAILABLE');
    const parsed=parseMetaTemplateComponents(c.whatsappTemplate.components);const destination=await this.resolveDestination(c,r,parsed.buttons);const recipient=destination.recipient;
    const groups=new Map<string,{type:string;index?:string;parameters:Array<Record<string,unknown>>}>();
    for(const m of (c.variableMappings||[]) as unknown as VariableMapping[]){let value=m.sourceType==='COLUMN'?String((recipient.originalData as Record<string,unknown>|null)?.[m.sourceColumn||'']??''):m.sourceType==='FIXED'?m.fixedValue||'':m.sourceType==='LEAD_NAME'?recipient.name||'':recipient.phone;if(m.component==='BUTTON'&&parsed.buttons[m.buttonIndex||0]?.type==='URL'&&destination.suffix)value=destination.suffix;if(!value||value.length>1024)throw new Error('CAMPAIGN_TEMPLATE_PARAMETER_INVALID');const key=m.component==='BUTTON'?`button:${m.buttonIndex}`:m.component.toLowerCase();if(!groups.has(key))groups.set(key,{type:m.component.toLowerCase(),...(m.component==='BUTTON'?{index:String(m.buttonIndex)}:{}),parameters:[]});groups.get(key)!.parameters.push({type:'text',text:value});}
    const headerType=parsed.headerType;
    if(['IMAGE','VIDEO','DOCUMENT'].includes(headerType)){const mediaId=await this.ensureCampaignMedia(c,account,headerType);groups.set('header-media',mediaHeader(headerType,mediaId)!);}
    return this.meta.sendTemplate({accessToken,phoneNumberId:account.phoneNumberId,to:to.replace('+',''),name:c.whatsappTemplate.metaName,language:c.whatsappTemplate.language,components:[...groups.values()]});
  }

  private async resolveDestination(c:any,r:any,buttons:Array<{type?:string;url?:string}>):Promise<{recipient:any;suffix?:string}>{
    const config=(c.destinationConfig||{}) as {mode?:string;fixedUrl?:string;agentId?:string};
    if(config.mode==='FIXED_URL'){
      if(!config.fixedUrl)throw new Error('CAMPAIGN_DESTINATION_UNAVAILABLE');
      const button=buttons.find(item=>item.type==='URL'&&item.url?.match(/{{\s*\d+\s*}}/));
      if(!button?.url)throw new Error('CAMPAIGN_TEMPLATE_DYNAMIC_URL_REQUIRED');
      return{recipient:r,suffix:dynamicUrlSuffix(button.url,config.fixedUrl)};
    }

    let assigned=r.assignedUserId as string|null;
    if(config.mode==='AGENT_FIXED'&&assigned&&assigned!==config.agentId){await this.pauseForMissingAgent(c,'Destinatário possui atribuição diferente do corretor fixo');throw new Error('CAMPAIGN_RECIPIENT_ALREADY_ASSIGNED');}
    if(!assigned&&config.mode==='AGENT_FIXED')assigned=config.agentId||null;
    if(!assigned&&config.mode==='ROUND_ROBIN')assigned=await this.assignRoundRobin(c.id,c.organizationId,r.id);
    if(!assigned){await this.pauseForMissingAgent(c,'Nenhum corretor elegível para a roleta');throw new Error('CAMPAIGN_NO_ELIGIBLE_AGENT');}

    const user=await this.prisma.user.findFirst({where:{id:assigned,organizationId:c.organizationId,active:true,status:'ACTIVE',deletedAt:null,role:{in:['CORRETOR','BROKER']}}});
    const participantValid=config.mode!=='ROUND_ROBIN'||await this.prisma.campaignAgent.count({where:{campaignId:c.id,userId:assigned,active:true}})>0;
    if(!user||!participantValid){await this.pauseForMissingAgent(c,'Corretor atribuído está inativo, arquivado ou inelegível');throw new Error('CAMPAIGN_NO_ELIGIBLE_AGENT');}

    if(!r.assignedUserId){const persisted=await this.prisma.campaignRecipient.updateMany({where:{id:r.id,campaignId:c.id,organizationId:c.organizationId,assignedUserId:null},data:{assignedUserId:user.id}});if(!persisted.count){r=await this.prisma.campaignRecipient.findFirstOrThrow({where:{id:r.id,campaignId:c.id,organizationId:c.organizationId}});}else r={...r,assignedUserId:user.id};}
    if(r.assignedUserId!==user.id)throw new Error('CAMPAIGN_RECIPIENT_ALREADY_ASSIGNED');
    const suffix=await this.secureLinkToken(c.organizationId,c.id,r.id,user.id);
    return{recipient:r,suffix};
  }

  private async assignRoundRobin(campaignId:string,organizationId:string,recipientId:string){
    for(let retry=0;retry<8;retry++){
      try{return await this.prisma.$transaction(async tx=>{
        const recipient=await tx.campaignRecipient.findFirst({where:{id:recipientId,campaignId,organizationId},select:{assignedUserId:true}});
        if(!recipient)throw new Error('CAMPAIGN_RECIPIENT_NOT_FOUND');
        if(recipient.assignedUserId)return recipient.assignedUserId;
        const campaign=await tx.campaign.findFirst({where:{id:campaignId,organizationId,status:{in:['QUEUED','RUNNING']}},select:{rotationCursor:true,agents:{where:{active:true,user:{organizationId,active:true,status:'ACTIVE',deletedAt:null,role:{in:['CORRETOR','BROKER']}}},orderBy:[{position:'asc'},{id:'asc'}],select:{userId:true,weight:true}}}});
        if(!campaign?.agents.length)return null;
        const selected=weightedAgentAt(campaign.agents,campaign.rotationCursor);
        if(!selected)return null;
        const cursor=await tx.campaign.updateMany({where:{id:campaignId,organizationId,rotationCursor:campaign.rotationCursor,status:{in:['QUEUED','RUNNING']}},data:{rotationCursor:campaign.rotationCursor+1}});
        if(!cursor.count)throw new Error('CAMPAIGN_ROTATION_CONFLICT');
        const assignment=await tx.campaignRecipient.updateMany({where:{id:recipientId,campaignId,organizationId,assignedUserId:null},data:{assignedUserId:selected}});
        if(!assignment.count)throw new Error('CAMPAIGN_ROTATION_CONFLICT');
        return selected;
      },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});}
      catch(error){if((error as {code?:string}).code!=='P2034'&&(error as Error).message!=='CAMPAIGN_ROTATION_CONFLICT')throw error;}
    }
    throw new Error('CAMPAIGN_ROTATION_CONFLICT');
  }

  private async pauseForMissingAgent(c:any,reason:string){const paused=await this.prisma.campaign.updateMany({where:{id:c.id,organizationId:c.organizationId,status:{in:['QUEUED','RUNNING']}},data:{status:'PAUSED',pausedAt:new Date()}});if(paused.count)await this.prisma.auditLog.create({data:{organizationId:c.organizationId,module:'campaigns',entityType:'Campaign',entityId:c.id,action:'campaign.rotation.blocked',before:{status:c.status},after:{status:'PAUSED'},metadata:{reason}}});}

  private async secureLinkToken(organizationId:string,campaignId:string,recipientId:string,assignedUserId:string){const secret=process.env.CAMPAIGN_LINK_SECRET||process.env.JWT_SECRET;if(!secret)throw new Error('CAMPAIGN_LINK_SECRET_NOT_CONFIGURED');const expiresAt=new Date(Date.now()+Number(process.env.CAMPAIGN_LINK_TTL_MS||2592000000));const token=createHmac('sha256',secret).update(`${organizationId}:${campaignId}:${recipientId}:${assignedUserId}:${expiresAt.toISOString()}`).digest('base64url');const tokenHash=createHash('sha256').update(token).digest('hex');await this.prisma.campaignSecureLink.upsert({where:{recipientId},create:{organizationId,campaignId,recipientId,assignedUserId,tokenHash,expiresAt},update:{assignedUserId,tokenHash,expiresAt,revokedAt:null}});return token;}

  private async ensureCampaignMedia(c:any,account:WhatsappAccountForQueue,headerType:string){
    const now=new Date(),allowed:Record<string,string[]>={IMAGE:['image/jpeg','image/png'],VIDEO:['video/mp4'],DOCUMENT:['application/pdf']};
    if(c.mediaUploadStatus==='FAILED_PERMANENT')throw new Error(c.mediaUploadError||'CAMPAIGN_MEDIA_UPLOAD_PERMANENT_FAILURE');
    if(c.mediaUploadStatus==='FAILED_RETRYABLE'&&c.mediaExpiresAt&&c.mediaExpiresAt>now)throw new Error('CAMPAIGN_MEDIA_UPLOAD_BACKOFF');
    if(!allowed[headerType]?.includes(c.mediaMimeType||''))throw new Error('CAMPAIGN_MEDIA_TYPE_INVALID');
    if(c.mediaMetaId&&c.mediaUploadStatus==='READY'&&(!c.mediaExpiresAt||c.mediaExpiresAt>now))return c.mediaMetaId;
    if(!c.mediaStorageKey||!c.mediaSha256||!c.mediaMimeType)throw new Error('CAMPAIGN_MEDIA_REQUIRED');
    const lock=await this.prisma.campaign.updateMany({where:{id:c.id,organizationId:c.organizationId,OR:[{mediaUploadStatus:null},{mediaUploadStatus:'EXPIRED'},{mediaUploadStatus:'FAILED'},{mediaUploadStatus:'FAILED_RETRYABLE',mediaExpiresAt:{lte:now}}]},data:{mediaUploadStatus:'UPLOADING',mediaUploadError:null}});
    if(!lock.count)throw new Error('CAMPAIGN_MEDIA_UPLOAD_IN_PROGRESS');
    try{
      const root=resolve(process.cwd(),'data','campaign-media',c.organizationId),path=resolve(c.mediaStorageKey);
      if(path!==root&&!path.startsWith(`${root}${sep}`))throw new Error('CAMPAIGN_MEDIA_PATH_INVALID');
      const bytes=await readFile(path),mime=detectMediaMime(bytes);
      if(mime!==c.mediaMimeType||createHash('sha256').update(bytes).digest('hex')!==c.mediaSha256)throw new Error('CAMPAIGN_MEDIA_INTEGRITY_INVALID');
      if(!allowed[headerType]?.includes(mime||''))throw new Error('CAMPAIGN_MEDIA_TYPE_INVALID');
      const uploaded=await this.meta.uploadMedia({encryptedAccessToken:account.accessToken,phoneNumberId:account.phoneNumberId,apiVersion:account.apiVersion,bytes,mimeType:mime!,fileName:basename(c.mediaOriginalName||path)});
      await this.prisma.campaign.update({where:{id:c.id},data:{mediaMetaId:uploaded.mediaId,mediaUploadedAt:now,mediaExpiresAt:new Date(now.getTime()+Number(process.env.CAMPAIGN_MEDIA_TTL_MS||2592000000)),mediaUploadStatus:'READY',mediaUploadError:null}});
      return uploaded.mediaId;
    }catch(error){
      const classified=classifyMetaError(error),retryAt=classified.retryable?new Date(Date.now()+Number(process.env.CAMPAIGN_MEDIA_RETRY_MS||60000)):null;
      await this.prisma.campaign.update({where:{id:c.id},data:{mediaUploadStatus:classified.retryable?'FAILED_RETRYABLE':'FAILED_PERMANENT',mediaExpiresAt:retryAt,mediaUploadError:classified.message}});
      throw error;
    }
  }

  private async recordWhatsappMessage(queue: MessageQueue, account: WhatsappAccountForQueue, payload: QueuePayload, externalMessageId: string) {
    const distribution = payload.distributionId ? await this.prisma.leadDistribution.findUnique({ where: { id: payload.distributionId } }) : null;
    const normalizedPhone = payload.to?.startsWith('+') ? payload.to : `+${payload.to ?? ''}`;
    let conversation = await this.prisma.whatsappConversation.findFirst({ where: { organizationId: queue.organizationId, whatsappAccountId: account.id, normalizedPhone, deletedAt: null } });
    if (!conversation) conversation = await this.prisma.whatsappConversation.create({ data: { organizationId: queue.organizationId, whatsappAccountId: account.id, leadId: distribution?.leadId ?? null, contactPhone: normalizedPhone, normalizedPhone, lastMessageAt: new Date(), lastOutboundAt: new Date() } });
    const messageType = payload.type === 'CONTACTS' ? 'CONTACTS' : payload.type === 'TEMPLATE' ? 'TEMPLATE' : 'TEXT';
    await this.prisma.whatsappMessage.create({ data: { organizationId: queue.organizationId, whatsappAccountId: account.id, conversationId: conversation.id, leadId: distribution?.leadId ?? null, externalMessageId, direction: 'OUTBOUND' as never, type: messageType as never, status: 'SENT' as never, senderPhone: account.normalizedPhone, recipientPhone: normalizedPhone, text: payload.type === 'TEXT' ? payload.text : null, metadata: { distributionId: payload.distributionId, queueId: queue.id, campaignId:queue.campaignId,recipientId:queue.recipientId, contacts: payload.contacts } as Prisma.InputJsonValue, sentAt: new Date() } });
  }

  async updateStatus(userId: string, id: string, status: QueueStatus, message = 'Status atualizado', extra: Prisma.MessageQueueUpdateInput = {}) {
    const queue = await this.getQueue(userId, id);
    const updated = await this.prisma.messageQueue.update({ where: { id }, data: { status, ...extra } });
    await this.registerLog(queue, status, message);
    return updated;
  }

  async markSuccess(id: string, message = 'Mensagem enviada com sucesso', response?: Prisma.InputJsonValue) {
    const queue = await this.prisma.messageQueue.update({ where: { id }, data: { status: 'SENT', finishedAt: new Date(), lastError: null } });
    await this.registerLog(queue, 'SENT', message, response);
    await this.updateDistributionFromQueue(queue.id, 'CONTACT_SENT');
    const externalMessageId=(response as {externalMessageId?:string}|undefined)?.externalMessageId;if(queue.recipientId)await this.prisma.campaignRecipient.updateMany({where:{id:queue.recipientId,organizationId:queue.organizationId,status:'PROCESSING'},data:{status:'SENT',sentAt:new Date(),externalMessageId,messageId:externalMessageId,errorMessage:null,errorCategory:null}});
    await this.recalculateCampaign(queue.campaignId,queue.organizationId);await this.feedCampaign(queue.campaignId,queue.organizationId);await this.reconcileCampaign(queue.campaignId,queue.organizationId);
    return queue;
  }

  async markFailure(id: string, error: string) {
    const current = await this.prisma.messageQueue.findUniqueOrThrow({ where: { id } });
    const classified=classifyMetaError(error);const retry = classified.retryable&&current.attempt < current.maxAttempts;
    const queue = await this.prisma.messageQueue.update({ where: { id }, data: { status: retry ? 'RETRYING' : 'FAILED', lastError:classified.message,scheduledAt:retry?new Date(Date.now()+Math.min(3600000,1000*2**current.attempt+Math.floor(Math.random()*500))):undefined, finishedAt: retry ? null : new Date() } });
    await this.registerLog(queue, queue.status, classified.message);
    if (!retry) await this.updateDistributionFromQueue(queue.id, 'FAILED', error);
    if(queue.recipientId){await this.prisma.campaignRecipient.updateMany({where:{id:queue.recipientId,organizationId:queue.organizationId,status:'PROCESSING'},data:{status:retry?'FAILED_RETRYABLE':'FAILED_PERMANENT',failedAt:new Date(),errorMessage:classified.message,errorCategory:classified.category,nextRetryAt:retry?queue.scheduledAt:null}});}
    await this.recalculateCampaign(queue.campaignId,queue.organizationId);await this.feedCampaign(queue.campaignId,queue.organizationId);await this.reconcileCampaign(queue.campaignId,queue.organizationId);
    return queue;
  }

  private async reconcileCampaign(campaignId:string,organizationId:string){const active=await this.prisma.campaignRecipient.count({where:{campaignId,organizationId,status:{in:['PENDING','QUEUED','PROCESSING','FAILED_RETRYABLE']}}});if(active)return;const failed=await this.prisma.campaignRecipient.count({where:{campaignId,organizationId,status:{in:['FAILED','FAILED_PERMANENT','UNKNOWN']}}});await this.prisma.campaign.updateMany({where:{id:campaignId,organizationId,status:{in:['RUNNING','QUEUED']}},data:{status:failed?'COMPLETED_WITH_ERRORS':'COMPLETED',finishedAt:new Date()}});}
  private async recalculateCampaign(campaignId:string,organizationId:string){const [groups,valid]=await Promise.all([this.prisma.campaignRecipient.groupBy({by:['status'],where:{campaignId,organizationId},orderBy:{status:'asc'},_count:{_all:true}}),this.prisma.campaignRecipient.count({where:{campaignId,organizationId,invalidReason:null,status:{not:'SKIPPED'}}})]);const count=Object.fromEntries(groups.map(group=>[group.status,group._count._all]));const read=count.READ||0,delivered=(count.DELIVERED||0)+read,sent=(count.SENT||0)+delivered,failed=(count.FAILED||0)+(count.FAILED_PERMANENT||0);await this.prisma.campaign.updateMany({where:{id:campaignId,organizationId},data:{totalContacts:valid,totalQueued:(count.QUEUED||0)+(count.PROCESSING||0),totalSent:sent,totalDelivered:delivered,totalRead:read,totalFailed:failed}});}

  async registerLog(queue: Pick<MessageQueue, 'id'|'campaignId'|'recipientId'>, status: QueueStatus, message: string, response?: Prisma.InputJsonValue) { return this.prisma.messageLog.create({ data: { queueId: queue.id, campaignId: queue.campaignId, recipientId: queue.recipientId, status, message, response } }); }
  private async updateDistributionFromQueue(queueId: string, status: 'CONTACT_SENT'|'FAILED', errorMessage?: string) { const queue = await this.prisma.messageQueue.findUnique({ where: { id: queueId }, select: { payload: true } }); const distributionId = (queue?.payload as { distributionId?: string } | null)?.distributionId; if (!distributionId) return; await this.prisma.leadDistribution.update({ where: { id: distributionId }, data: { status: status as never, errorMessage: errorMessage ?? null } }).catch(() => undefined); }

  async logs(userId: string, query: ListMessageLogsDto) { const organizationId = await this.getOrganizationId(userId); const page=query.page??1, limit=query.limit??10; const where: Prisma.MessageLogWhereInput = { queue: { organizationId }, ...(query.queueId?{queueId:query.queueId}:{}), ...(query.campaignId?{campaignId:query.campaignId}:{}), ...(query.recipientId?{recipientId:query.recipientId}:{}), ...(query.status?{status:query.status}:{}) }; const [items,total]=await this.prisma.$transaction([this.prisma.messageLog.findMany({where,include:{queue:{select:{id:true,priority:true,attempt:true,maxAttempts:true}}},orderBy:{createdAt:'desc'},skip:(page-1)*limit,take:limit}),this.prisma.messageLog.count({where})]); return {items,meta:{total,page,limit,totalPages:Math.ceil(total/limit)}}; }
  async log(userId: string, id: string) { const organizationId = await this.getOrganizationId(userId); const log = await this.prisma.messageLog.findFirst({ where: { id, queue: { organizationId } }, include: { queue: true } }); if (!log) throw new NotFoundException('Log não encontrado'); return log; }
  async getOrganizationId(userId: string) { const user=await this.prisma.user.findFirst({where:{id:userId,active:true,deletedAt:null}}); if(!user?.organizationId) throw new ForbiddenException('Usuário sem organização ativa'); return user.organizationId; }
  private async getQueue(userId: string, id: string) { const organizationId=await this.getOrganizationId(userId); const queue=await this.prisma.messageQueue.findFirst({where:{id,organizationId},include:{campaign:{select:{id:true,name:true}},recipient:{select:{id:true,name:true,phone:true}},logs:{orderBy:{createdAt:'desc'},take:20}}}); if(!queue) throw new NotFoundException('Fila não encontrada'); return queue; }
}
export { activeStatuses };
