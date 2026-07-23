import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MessageQueue, Prisma, Priority, QueueStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MetaWhatsappClient } from '../whatsapp/meta/meta-whatsapp.client';
import { WhatsappCredentialCryptoService } from '../whatsapp/security/credential-crypto.service';
import { CreateMessageQueueDto } from './dto/create-message-queue.dto';
import { ListMessageLogsDto } from './dto/list-message-logs.dto';
import { ListMessageQueuesDto } from './dto/list-message-queues.dto';

const priorityRank: Record<Priority, number> = { LOW: 1, NORMAL: 2, HIGH: 3, URGENT: 4 };
const activeStatuses: QueueStatus[] = ['PENDING', 'WAITING', 'PROCESSING', 'RETRYING'];

type QueuePayload = {
  type?: string;
  to?: string;
  text?: string;
  contacts?: { displayName: string; phoneE164: string }[];
  distributionId?: string;
};

type WhatsappAccountForQueue = {
  id: string;
  organizationId: string;
  accessToken: string;
  phoneNumberId: string;
  normalizedPhone: string;
};

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meta: MetaWhatsappClient,
    private readonly crypto: WhatsappCredentialCryptoService,
  ) {}

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
    const account = await this.prisma.whatsappAccount.findFirst({ where: { id: queue.whatsappAccountId, organizationId: queue.organizationId, deletedAt: null } }) as WhatsappAccountForQueue | null;
    if (!account) throw new Error('Conta WhatsApp não encontrada para a fila');
    if (!payload.to) throw new Error('Fila sem destinatário WhatsApp');

    const accessToken = this.crypto.decrypt(account.accessToken);
    const to = payload.to.replace('+', '');
    const result = payload.type === 'TEXT'
      ? await this.meta.sendText({ accessToken, phoneNumberId: account.phoneNumberId, to, text: payload.text ?? '' })
      : payload.type === 'CONTACTS'
        ? await this.meta.sendContacts({ accessToken, phoneNumberId: account.phoneNumberId, to, contacts: payload.contacts ?? [] })
        : await Promise.reject(new Error(`Tipo de mensagem não suportado pela fila: ${payload.type ?? 'UNKNOWN'}`));

    await this.recordWhatsappMessage(queue, account, payload, result.externalMessageId);
    return result;
  }

  private async recordWhatsappMessage(queue: MessageQueue, account: WhatsappAccountForQueue, payload: QueuePayload, externalMessageId: string) {
    const distribution = payload.distributionId ? await this.prisma.leadDistribution.findUnique({ where: { id: payload.distributionId } }) : null;
    const normalizedPhone = payload.to?.startsWith('+') ? payload.to : `+${payload.to ?? ''}`;
    let conversation = await this.prisma.whatsappConversation.findFirst({ where: { organizationId: queue.organizationId, whatsappAccountId: account.id, normalizedPhone, deletedAt: null } });
    if (!conversation) conversation = await this.prisma.whatsappConversation.create({ data: { organizationId: queue.organizationId, whatsappAccountId: account.id, leadId: distribution?.leadId ?? null, contactPhone: normalizedPhone, normalizedPhone, lastMessageAt: new Date(), lastOutboundAt: new Date() } });
    const messageType = payload.type === 'CONTACTS' ? 'CONTACTS' : 'TEXT';
    await this.prisma.whatsappMessage.create({ data: { organizationId: queue.organizationId, whatsappAccountId: account.id, conversationId: conversation.id, leadId: distribution?.leadId ?? null, externalMessageId, direction: 'OUTBOUND' as never, type: messageType as never, status: 'SENT' as never, senderPhone: account.normalizedPhone, recipientPhone: normalizedPhone, text: payload.type === 'TEXT' ? payload.text : null, metadata: { distributionId: payload.distributionId, queueId: queue.id, contacts: payload.contacts } as Prisma.InputJsonValue, sentAt: new Date() } });
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
    return queue;
  }

  async markFailure(id: string, error: string) {
    const current = await this.prisma.messageQueue.findUniqueOrThrow({ where: { id } });
    const retry = current.attempt < current.maxAttempts;
    const queue = await this.prisma.messageQueue.update({ where: { id }, data: { status: retry ? 'RETRYING' : 'FAILED', lastError: error, finishedAt: retry ? null : new Date() } });
    await this.registerLog(queue, queue.status, error);
    if (!retry) await this.updateDistributionFromQueue(queue.id, 'FAILED', error);
    return queue;
  }

  async registerLog(queue: Pick<MessageQueue, 'id'|'campaignId'|'recipientId'>, status: QueueStatus, message: string, response?: Prisma.InputJsonValue) { return this.prisma.messageLog.create({ data: { queueId: queue.id, campaignId: queue.campaignId, recipientId: queue.recipientId, status, message, response } }); }
  private async updateDistributionFromQueue(queueId: string, status: 'CONTACT_SENT'|'FAILED', errorMessage?: string) { const queue = await this.prisma.messageQueue.findUnique({ where: { id: queueId }, select: { payload: true } }); const distributionId = (queue?.payload as { distributionId?: string } | null)?.distributionId; if (!distributionId) return; await this.prisma.leadDistribution.update({ where: { id: distributionId }, data: { status: status as never, errorMessage: errorMessage ?? null } }).catch(() => undefined); }

  async logs(userId: string, query: ListMessageLogsDto) { const organizationId = await this.getOrganizationId(userId); const page=query.page??1, limit=query.limit??10; const where: Prisma.MessageLogWhereInput = { queue: { organizationId }, ...(query.queueId?{queueId:query.queueId}:{}), ...(query.campaignId?{campaignId:query.campaignId}:{}), ...(query.recipientId?{recipientId:query.recipientId}:{}), ...(query.status?{status:query.status}:{}) }; const [items,total]=await this.prisma.$transaction([this.prisma.messageLog.findMany({where,include:{queue:{select:{id:true,priority:true,attempt:true,maxAttempts:true}}},orderBy:{createdAt:'desc'},skip:(page-1)*limit,take:limit}),this.prisma.messageLog.count({where})]); return {items,meta:{total,page,limit,totalPages:Math.ceil(total/limit)}}; }
  async log(userId: string, id: string) { const organizationId = await this.getOrganizationId(userId); const log = await this.prisma.messageLog.findFirst({ where: { id, queue: { organizationId } }, include: { queue: true } }); if (!log) throw new NotFoundException('Log não encontrado'); return log; }
  async getOrganizationId(userId: string) { const user=await this.prisma.user.findFirst({where:{id:userId,active:true,deletedAt:null}}); if(!user?.organizationId) throw new ForbiddenException('Usuário sem organização ativa'); return user.organizationId; }
  private async getQueue(userId: string, id: string) { const organizationId=await this.getOrganizationId(userId); const queue=await this.prisma.messageQueue.findFirst({where:{id,organizationId},include:{campaign:{select:{id:true,name:true}},recipient:{select:{id:true,name:true,phone:true}},logs:{orderBy:{createdAt:'desc'},take:20}}}); if(!queue) throw new NotFoundException('Fila não encontrada'); return queue; }
}
export { activeStatuses };
