import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWhatsappAccountDto } from './dto/create-whatsapp-account.dto';
import { ListWhatsappDto } from './dto/list-whatsapp.dto';
import { SyncWhatsappTemplatesDto } from './dto/sync-whatsapp-templates.dto';
import { UpdateWhatsappAccountDto } from './dto/update-whatsapp-account.dto';

const accountInclude = { organization: { select: { id: true, name: true, active: true } } } satisfies Prisma.WhatsappAccountInclude;
const templateInclude = { organization: { select: { id: true, name: true, active: true } } } satisfies Prisma.WhatsappTemplateInclude;

@Injectable()
export class WhatsappService {
  constructor(private readonly prisma: PrismaService) {}

  async findAccounts(query: ListWhatsappDto) {
    return this.prisma.whatsappAccount.findMany({
      where: { deletedAt: null, ...(query.organizationId ? { organizationId: query.organizationId } : {}) },
      include: accountInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAccount(data: CreateWhatsappAccountDto) {
    await this.ensureOrganization(data.organizationId);
    return this.prisma.whatsappAccount.create({
      data: { ...data, status: data.status ?? 'DISCONNECTED', connectedAt: data.status === 'CONNECTED' ? new Date() : undefined },
      include: accountInclude,
    });
  }

  async updateAccount(id: string, data: UpdateWhatsappAccountDto) {
    const current = await this.findAccount(id);
    const organizationId = data.organizationId ?? current.organizationId;
    await this.ensureOrganization(organizationId);
    return this.prisma.whatsappAccount.update({
      where: { id },
      data: { ...data, organizationId, connectedAt: data.status === 'CONNECTED' && !current.connectedAt ? new Date() : undefined },
      include: accountInclude,
    });
  }

  async removeAccount(id: string) {
    await this.findAccount(id);
    await this.prisma.whatsappAccount.update({ where: { id }, data: { deletedAt: new Date(), status: 'DISCONNECTED' } });
    return { success: true };
  }

  async findTemplates(query: ListWhatsappDto) {
    return this.prisma.whatsappTemplate.findMany({
      where: { ...(query.organizationId ? { organizationId: query.organizationId } : {}) },
      include: templateInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async syncTemplates(data: SyncWhatsappTemplatesDto) {
    const account = await this.findAccount(data.accountId);
    if (account.organizationId !== data.organizationId) throw new BadRequestException('Conta não pertence à organização informada');
    await this.prisma.whatsappAccount.update({ where: { id: data.accountId }, data: { lastSyncAt: new Date() } });
    return { success: true, message: 'Infraestrutura de sincronização preparada para a API Oficial da Meta.' };
  }

  async verifyWebhook(mode?: string, verifyToken?: string, challenge?: string) {
    if (mode !== 'subscribe' || !verifyToken || !challenge) throw new BadRequestException('Parâmetros de verificação inválidos');
    const account = await this.prisma.whatsappAccount.findFirst({ where: { verifyToken, deletedAt: null } });
    if (!account) throw new UnauthorizedException('Verify token inválido');
    return challenge;
  }

  receiveWebhook(payload: unknown) {
    return { success: true, received: Boolean(payload) };
  }

  private async findAccount(id: string) {
    const account = await this.prisma.whatsappAccount.findFirst({ where: { id, deletedAt: null }, include: accountInclude });
    if (!account) throw new NotFoundException('Conta de WhatsApp não encontrada');
    return account;
  }

  private async ensureOrganization(id: string) {
    const organization = await this.prisma.organization.findFirst({ where: { id, active: true, deletedAt: null } });
    if (!organization) throw new NotFoundException('Organização ativa não encontrada');
  }
}
