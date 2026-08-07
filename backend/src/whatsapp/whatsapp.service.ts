import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { Prisma, Role } from '@prisma/client';

import {
  AccessContextService,
  AuthenticatedUserRef,
} from '../auth/access-context.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

import {
  AssignConversationDto,
  UpdateConversationDto,
} from './dto/conversations.dto';
import { CreateWhatsappTemplateDto } from './dto/create-whatsapp-template.dto';
import { ListWhatsappDto } from './dto/list-whatsapp.dto';
import { ListWhatsappTemplatesDto } from './dto/list-whatsapp-templates.dto';
import {
  SendMediaMessageDto,
  SendTemplateMessageDto,
  SendTextMessageDto,
} from './dto/messages.dto';
import { SyncWhatsappTemplatesDto } from './dto/sync-whatsapp-templates.dto';
import {
  UpdateWhatsappAccountDto,
  UpdateWhatsappAccountStatusDto,
} from './dto/update-whatsapp-account.dto';
import { UpdateWhatsappTemplateDto } from './dto/update-whatsapp-template.dto';

import { MetaWhatsappClient } from './meta/meta-whatsapp.client';
import { WhatsappWindowPolicy } from './policies/whatsapp-window.policy';
import { WhatsappCredentialCryptoService } from './security/credential-crypto.service';
import { redactSecrets, sanitizeError } from './security/redact';

const selectAccount = {
  id: true,
  organizationId: true,
  name: true,
  phoneNumber: true,
  normalizedPhone: true,
  displayPhoneNumber: true,
  verifiedName: true,
  phoneNumberId: true,
  businessAccountId: true,
  metaBusinessId: true,
  metaBusinessName: true,
  credentialType: true,
  tokenExpiresAt: true,
  tokenLastRenewedAt: true,
  grantedScopes: true,
  appId: true,
  apiVersion: true,
  status: true,
  isDefault: true,
  qualityRating: true,
  messagingLimitTier: true,
  connectedAt: true,
  lastSyncAt: true,
  lastConnectionTestAt: true,
  lastConnectionError: true,
  createdByUserId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
};

const statusRank: Record<string, number> = {
  SENT: 1,
  DELIVERED: 2,
  READ: 3,
  FAILED: 4,
};

@Injectable()
export class WhatsappService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessContextService,
    private readonly audit: AuditService,
    private readonly crypto: WhatsappCredentialCryptoService,
    private readonly meta: MetaWhatsappClient,
    private readonly windowPolicy: WhatsappWindowPolicy,
  ) {}

  normalizePhone(phone: string) {
    const digits = (phone || '').replace(/\D/g, '');

    if (digits.length < 10 || digits.length > 15) {
      throw new BadRequestException('WHATSAPP_INVALID_PHONE');
    }

    return digits.startsWith('55') || digits.length > 11
      ? `+${digits}`
      : `+55${digits}`;
  }

  private scope(ctx: {
    global: boolean;
    organizationId: string | null;
  }) {
    if (ctx.global) {
      throw new BadRequestException(
        'WHATSAPP_ORGANIZATION_CONTEXT_REQUIRED',
      );
    }

    if (!ctx.organizationId) {
      throw new ForbiddenException('Organização obrigatória');
    }

    return ctx.organizationId;
  }

  private async accountInOrg(
    id: string,
    org: string,
    withSecrets = false,
  ) {
    const account = await this.prisma.whatsappAccount.findFirst({
      where: {
        id,
        organizationId: org,
        deletedAt: null,
      },
      ...(withSecrets ? {} : { select: selectAccount }),
    });

    if (!account) {
      throw new NotFoundException('Conta WhatsApp não encontrada');
    }

    return account as any;
  }

  private async auditSafe(
    org: string,
    action: string,
    entityType: string,
    entityId: string,
    actor: string | null,
    before?: unknown,
    after?: unknown,
  ) {
    await this.audit.record({
      organizationId: org,
      actorUserId: actor,
      module: 'whatsapp',
      entityType,
      entityId,
      action,
      before: redactSecrets(before) as Prisma.InputJsonValue,
      after: redactSecrets(after) as Prisma.InputJsonValue,
    });
  }

  private async validAccessToken(account: any) {
    let token = this.crypto.decrypt(account.accessToken);

    if (account.credentialType === 'SYSTEM_USER') {
      return token;
    }

    const renewalThreshold = Date.now() + 24 * 60 * 60 * 1000;

    if (
      !account.tokenExpiresAt ||
      new Date(account.tokenExpiresAt).getTime() > renewalThreshold
    ) {
      return token;
    }

    try {
      const renewed = await this.meta.renewToken(token);

      token = renewed.accessToken;

      await this.prisma.whatsappAccount.update({
        where: { id: account.id },
        data: {
          accessToken: this.crypto.encrypt(token),
          tokenExpiresAt: renewed.expiresAt,
          tokenLastRenewedAt: new Date(),
          lastConnectionError: null,
        },
      });

      return token;
    } catch {
      await this.prisma.whatsappAccount.update({
        where: { id: account.id },
        data: {
          status: 'TOKEN_EXPIRED' as never,
          lastConnectionError:
            'A autorização da Meta expirou. Reconecte a conta.',
        },
      });

      throw new UnauthorizedException(
        'WHATSAPP_META_REAUTHORIZATION_REQUIRED',
      );
    }
  }

  async findAccounts(
    q: ListWhatsappDto,
    user: AuthenticatedUserRef,
  ) {
    const ctx = await this.access.resolve(user);
    const org = this.scope(ctx);

    const page = Math.max(1, q.page ?? 1);
    const pageSize = Math.min(
      100,
      q.pageSize ?? q.limit ?? 20,
    );

    const includeArchived =
      q.state === 'archived' ||
      q.state === 'all' ||
      q.archived === 'true';

    const where: Prisma.WhatsappAccountWhereInput = {
      organizationId: org,

      ...(includeArchived
        ? {}
        : {
            deletedAt: null,
          }),

      ...(q.state === 'archived'
        ? {
            deletedAt: {
              not: null,
            },
          }
        : {}),

      ...(q.state === 'active'
        ? {
            status: 'ACTIVE' as never,
          }
        : {}),

      ...(q.state === 'inactive'
        ? {
            status: 'INACTIVE' as never,
          }
        : {}),

      ...(q.status
        ? {
            status: q.status as never,
          }
        : {}),

      ...(q.search
        ? {
            OR: [
              {
                name: {
                  contains: q.search,
                  mode: 'insensitive',
                },
              },
              {
                phoneNumber: {
                  contains: q.search,
                },
              },
              {
                displayPhoneNumber: {
                  contains: q.search,
                },
              },
              {
                verifiedName: {
                  contains: q.search,
                  mode: 'insensitive',
                },
              },
              {
                businessAccountId: {
                  contains: q.search,
                },
              },
              {
                phoneNumberId: {
                  contains: q.search,
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] =
      await this.prisma.$transaction([
        this.prisma.whatsappAccount.findMany({
          where,
          select: selectAccount,
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'desc' },
            { id: 'asc' },
          ],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),

        this.prisma.whatsappAccount.count({
          where,
        }),
      ]);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(
        1,
        Math.ceil(total / pageSize),
      ),
    };
  }

  async getAccount(
    id: string,
    user: AuthenticatedUserRef,
  ) {
    const ctx = await this.access.resolve(user);

    return this.accountInOrg(
      id,
      this.scope(ctx),
    );
  }

  async updateAccount(
    id: string,
    d: UpdateWhatsappAccountDto,
    user: AuthenticatedUserRef,
  ) {
    const ctx = await this.access.resolve(user);
    const org = this.scope(ctx);

    const cur = await this.accountInOrg(
      id,
      org,
      true,
    );

    const normalizedPhone = d.phoneNumber
      ? this.normalizePhone(d.phoneNumber)
      : undefined;

    if (
      normalizedPhone &&
      normalizedPhone !== cur.normalizedPhone
    ) {
      const duplicate =
        await this.prisma.whatsappAccount.findFirst({
          where: {
            organizationId: org,
            normalizedPhone,
            deletedAt: null,
            id: {
              not: id,
            },
          },
        });

      if (duplicate) {
        throw new BadRequestException(
          'WHATSAPP_ACCOUNT_DUPLICATE_PHONE',
        );
      }
    }

    const updated =
      await this.prisma.whatsappAccount.update({
        where: {
          id,
        },

        data: {
          name: d.name?.trim(),
          phoneNumber: d.phoneNumber,
          normalizedPhone,
          phoneNumberId: d.phoneNumberId?.trim(),
          businessAccountId:
            d.businessAccountId?.trim(),
          appId: d.appId?.trim(),
          apiVersion: d.apiVersion?.trim(),
          status: d.status as never,

          verifyToken: d.verifyToken
            ? this.crypto.encrypt(d.verifyToken)
            : undefined,

          appSecret: d.appSecret
            ? this.crypto.encrypt(d.appSecret)
            : undefined,

          webhookSecret: d.webhookSecret
            ? this.crypto.encrypt(d.webhookSecret)
            : undefined,
        },

        select: selectAccount,
      });

    await this.auditSafe(
      org,
      'whatsapp.account.updated',
      'WhatsappAccount',
      id,
      ctx.id,
      cur,
      updated,
    );

    return updated;
  }

  async archiveAccount(
    id: string,
    user: AuthenticatedUserRef,
  ) {
    const ctx = await this.access.resolve(user);
    const org = this.scope(ctx);

    const cur = await this.accountInOrg(
      id,
      org,
    );

    const activeCampaign =
      await this.prisma.campaign.findFirst({
        where: {
          organizationId: org,
          whatsappAccountId: id,
          deletedAt: null,
          archivedAt: null,

          status: {
            in: [
              'RUNNING',
              'SCHEDULED',
            ] as never,
          },
        },
      });

    if (activeCampaign) {
      throw new BadRequestException(
        'WHATSAPP_ACCOUNT_HAS_ACTIVE_CAMPAIGN',
      );
    }

    await this.prisma.whatsappAccount.update({
      where: {
        id,
      },

      data: {
        deletedAt: new Date(),
        status: 'DISCONNECTED' as never,
        isDefault: false,
      },
    });

    await this.auditSafe(
      org,
      'whatsapp.account.archived',
      'WhatsappAccount',
      id,
      ctx.id,
      cur,
      {
        id,
        deletedAt: true,
      },
    );

    return {
      success: true,
    };
  }

  async restoreAccount(
    id: string,
    user: AuthenticatedUserRef,
  ) {
    const ctx = await this.access.resolve(user);
    const org = this.scope(ctx);

    const cur =
      await this.prisma.whatsappAccount.findFirst({
        where: {
          id,
          organizationId: org,
        },
      });

    if (!cur) {
      throw new NotFoundException(
        'Conta WhatsApp não encontrada',
      );
    }

    const duplicate =
      await this.prisma.whatsappAccount.findFirst({
        where: {
          organizationId: org,
          deletedAt: null,
          id: {
            not: id,
          },
          OR: [
            {
              phoneNumberId: cur.phoneNumberId,
            },
            {
              normalizedPhone:
                cur.normalizedPhone,
            },
          ],
        },
      });

    if (duplicate) {
      throw new BadRequestException(
        'WHATSAPP_ACCOUNT_DUPLICATE_PHONE',
      );
    }

    const updated =
      await this.prisma.whatsappAccount.update({
        where: {
          id,
        },

        data: {
          deletedAt: null,
          status: 'INACTIVE' as never,
          isDefault: false,
        },

        select: selectAccount,
      });

    await this.auditSafe(
      org,
      'whatsapp.account.restored',
      'WhatsappAccount',
      id,
      ctx.id,
      cur,
      updated,
    );

    return updated;
  }

  async testAccount(
    id: string,
    user: AuthenticatedUserRef,
  ) {
    const ctx = await this.access.resolve(user);
    const org = this.scope(ctx);

    const account = await this.accountInOrg(
      id,
      org,
      true,
    );

    try {
      const result =
        await this.meta.testConnection({
          accessToken:
            await this.validAccessToken(account),

          phoneNumberId:
            account.phoneNumberId,

          apiVersion:
            account.apiVersion,
        });

      const updated =
        await this.prisma.whatsappAccount.update({
          where: {
            id,
          },

          data: {
            status: result.ok
              ? ('ACTIVE' as never)
              : ('ERROR' as never),

            connectedAt: result.ok
              ? new Date()
              : account.connectedAt,

            displayPhoneNumber:
              result.displayPhoneNumber,

            verifiedName:
              result.verifiedName,

            qualityRating:
              result.qualityRating,

            messagingLimitTier:
              result.messagingLimitTier,

            lastConnectionTestAt:
              new Date(),

            lastConnectionError:
              null,
          },

          select: selectAccount,
        });

      await this.auditSafe(
        org,
        'whatsapp.account.tested',
        'WhatsappAccount',
        id,
        ctx.id,
        null,
        {
          ok: result.ok,
        },
      );

      return updated;
    } catch (e) {
      const err = sanitizeError(e);

      await this.prisma.whatsappAccount.update({
        where: {
          id,
        },

        data: {
          status: 'ERROR' as never,
          lastConnectionTestAt: new Date(),
          lastConnectionError: err,
        },
      });

      throw new BadRequestException({
        code: 'WHATSAPP_META_CONNECTION_FAILED',
        message: err,
      });
    }
  }

  /*
   * TESTE DE ENVIO REAL PELA API OFICIAL DA META
   *
   * Esta função não depende de Conversation nem de janela
   * de atendimento. Ela usa obrigatoriamente um template
   * aprovado, que é a forma correta de iniciar uma conversa
   * comercial fora da janela de 24 horas.
   */
  async sendTest(
    id: string,
    body: {
      phone: string;
      templateId: string;
      components?: unknown[];
    },
    user: AuthenticatedUserRef,
  ) {
    const ctx = await this.access.resolve(user);
    const org = this.scope(ctx);

    const account = await this.accountInOrg(
      id,
      org,
      true,
    );

    const phone = this.normalizePhone(
      body?.phone || '',
    );

    if (!body?.templateId?.trim()) {
      throw new BadRequestException(
        'WHATSAPP_TEST_TEMPLATE_REQUIRED',
      );
    }

    const template =
      await this.prisma.whatsappTemplate.findFirst({
        where: {
          id: body.templateId,
          organizationId: org,
          whatsappAccountId: id,
          deletedAt: null,
          isActive: true,
        },
      });

    if (!template) {
      throw new BadRequestException(
        'WHATSAPP_TEST_TEMPLATE_NOT_FOUND',
      );
    }

    if (template.status !== 'APPROVED') {
      throw new BadRequestException(
        'WHATSAPP_TEMPLATE_NOT_APPROVED',
      );
    }

    try {
      const accessToken =
        await this.validAccessToken(account);

      const result =
        await this.meta.sendTemplate({
          accessToken,

          phoneNumberId:
            account.phoneNumberId,

          to: phone.replace('+', ''),

          name:
            template.metaName ||
            template.name,

          language:
            template.language,

          components:
            body.components ?? [],
        });

      await this.auditSafe(
        org,
        'whatsapp.message.test_sent',
        'WhatsappAccount',
        id,
        ctx.id,
        null,
        {
          accountId: id,
          phone,
          templateId: template.id,
          templateName:
            template.metaName ||
            template.name,
          externalMessageId:
            result.externalMessageId,
        },
      );

      return {
        success: true,
        status: 'SENT',
        phone,
        templateId: template.id,
        templateName:
          template.metaName ||
          template.name,
        externalMessageId:
          result.externalMessageId,
      };
    } catch (e) {
      const err = sanitizeError(e);

      await this.auditSafe(
        org,
        'whatsapp.message.test_failed',
        'WhatsappAccount',
        id,
        ctx.id,
        null,
        {
          phone,
          templateId: template.id,
          error: err,
        },
      ).catch(() => undefined);

      throw new BadRequestException({
        code:
          'WHATSAPP_META_SEND_TEST_FAILED',
        message: err,
      });
    }
  }

  async updateAccountStatus(
    id: string,
    d: UpdateWhatsappAccountStatusDto,
    user: AuthenticatedUserRef,
  ) {
    const ctx = await this.access.resolve(user);
    const org = this.scope(ctx);

    const cur = await this.accountInOrg(
      id,
      org,
    );

    const updated =
      await this.prisma.whatsappAccount.update({
        where: {
          id,
        },

        data: {
          status: d.status as never,

          isDefault:
            d.status === 'INACTIVE'
              ? false
              : undefined,
        },

        select: selectAccount,
      });

    await this.auditSafe(
      org,
      'whatsapp.account.status_updated',
      'WhatsappAccount',
      id,
      ctx.id,
      cur,
      updated,
    );

    return updated;
  }

  async setDefaultAccount(
    id: string,
    user: AuthenticatedUserRef,
  ) {
    const ctx = await this.access.resolve(user);
    const org = this.scope(ctx);

    await this.accountInOrg(id, org);

    const [, updated] =
      await this.prisma.$transaction([
        this.prisma.whatsappAccount.updateMany({
          where: {
            organizationId: org,
            deletedAt: null,
            isDefault: true,
          },

          data: {
            isDefault: false,
          },
        }),

        this.prisma.whatsappAccount.update({
          where: {
            id,
          },

          data: {
            isDefault: true,
            status: 'ACTIVE' as never,
          },

          select: selectAccount,
        }),
      ]);

    await this.auditSafe(
      org,
      'whatsapp.account.default_set',
      'WhatsappAccount',
      id,
      ctx.id,
      null,
      {
        id,
      },
    );

    return updated;
  }

  async syncAccount(
    id: string,
    user: AuthenticatedUserRef,
  ) {
    const ctx = await this.access.resolve(user);
    const org = this.scope(ctx);

    const account = await this.accountInOrg(
      id,
      org,
      true,
    );

    try {
      const result =
        await this.meta.syncAccount({
          accessToken:
            await this.validAccessToken(account),

          phoneNumberId:
            account.phoneNumberId,

          apiVersion:
            account.apiVersion,
        });

      const updated =
        await this.prisma.whatsappAccount.update({
          where: {
            id,
          },

          data: {
            displayPhoneNumber:
              result.displayPhoneNumber,

            verifiedName:
              result.verifiedName,

            qualityRating:
              result.qualityRating,

            messagingLimitTier:
              result.messagingLimitTier,

            status: 'ACTIVE' as never,
            lastSyncAt: new Date(),
            lastConnectionError: null,
          },

          select: selectAccount,
        });

      await this.auditSafe(
        org,
        'whatsapp.account.synced',
        'WhatsappAccount',
        id,
        ctx.id,
        null,
        {
          id,
        },
      );

      return updated;
    } catch (e) {
      const err = sanitizeError(e);

      const updated =
        await this.prisma.whatsappAccount.update({
          where: {
            id,
          },

          data: {
            status: 'ERROR' as never,
            lastConnectionError: err,
          },

          select: selectAccount,
        });

      throw new BadRequestException({
        code: 'WHATSAPP_META_SYNC_FAILED',
        message: err,
        account: updated,
      });
    }
  }

  async listConversations(
    q: ListWhatsappDto,
    user: AuthenticatedUserRef,
  ) {
    const ctx = await this.access.resolve(user);
    const org = this.scope(ctx);

    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    const brokerOnly =
      ctx.role === Role.BROKER &&
      !ctx.permissions.includes(
        'whatsapp:conversations:read-all',
      );

    const where: any = {
      organizationId: org,
      deletedAt: null,

      ...(q.status
        ? {
            status: q.status,
          }
        : {}),

      ...(brokerOnly
        ? {
            assignedUserId: ctx.id,
          }
        : {}),
    };

    const [items, total] =
      await this.prisma.$transaction([
        this.prisma.whatsappConversation.findMany({
          where,
          orderBy: {
            lastMessageAt: 'desc',
          },
          skip: (page - 1) * limit,
          take: limit,
        }),

        this.prisma.whatsappConversation.count({
          where,
        }),
      ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(
          1,
          Math.ceil(total / limit),
        ),
      },
    };
  }

  async getConversation(
    id: string,
    user: AuthenticatedUserRef,
  ) {
    const ctx = await this.access.resolve(user);
    const org = this.scope(ctx);

    const conversation =
      await this.prisma.whatsappConversation.findFirst({
        where: {
          id,
          organizationId: org,
          deletedAt: null,
        },
      });

    if (!conversation) {
      throw new NotFoundException(
        'Conversa não encontrada',
      );
    }

    if (
      ctx.role === Role.BROKER &&
      conversation.assignedUserId !== ctx.id &&
      !ctx.permissions.includes(
        'whatsapp:conversations:read-all',
      )
    ) {
      throw new ForbiddenException(
        'WHATSAPP_CONVERSATION_FORBIDDEN',
      );
    }

    return conversation;
  }

  async updateConversation(
    id: string,
    d: UpdateConversationDto,
    user: AuthenticatedUserRef,
  ) {
    await this.getConversation(id, user);

    return this.prisma.whatsappConversation.update({
      where: {
        id,
      },

      data: {
        status: d.status as never,
        contactName: d.contactName,
      },
    });
  }

  async assignConversation(
    id: string,
    d: AssignConversationDto,
    user: AuthenticatedUserRef,
  ) {
    const conversation =
      await this.getConversation(id, user);

    if (d.assignedUserId) {
      await this.ensureUser(
        conversation.organizationId,
        d.assignedUserId,
      );
    }

    if (d.managerUserId) {
      await this.ensureUser(
        conversation.organizationId,
        d.managerUserId,
      );
    }

    const updated =
      await this.prisma.whatsappConversation.update({
        where: {
          id,
        },

        data: {
          assignedUserId:
            d.assignedUserId ?? null,

          managerUserId:
            d.managerUserId ?? null,
        },
      });

    await this.auditSafe(
      conversation.organizationId,
      'whatsapp.conversation.assigned',
      'WhatsappConversation',
      id,
      user.id,
      conversation,
      updated,
    );

    return updated;
  }

  async closeConversation(
    id: string,
    user: AuthenticatedUserRef,
  ) {
    const conversation =
      await this.getConversation(id, user);

    const updated =
      await this.prisma.whatsappConversation.update({
        where: {
          id,
        },

        data: {
          status: 'CLOSED' as never,
          unreadCount: 0,
        },
      });

    await this.auditSafe(
      conversation.organizationId,
      'whatsapp.conversation.closed',
      'WhatsappConversation',
      id,
      user.id,
      conversation,
      updated,
    );

    return updated;
  }

  async reopenConversation(
    id: string,
    user: AuthenticatedUserRef,
  ) {
    const conversation =
      await this.getConversation(id, user);

    const updated =
      await this.prisma.whatsappConversation.update({
        where: {
          id,
        },

        data: {
          status: 'OPEN' as never,
        },
      });

    await this.auditSafe(
      conversation.organizationId,
      'whatsapp.conversation.reopened',
      'WhatsappConversation',
      id,
      user.id,
      conversation,
      updated,
    );

    return updated;
  }

  async messages(
    id: string,
    q: ListWhatsappDto,
    user: AuthenticatedUserRef,
  ) {
    const conversation =
      await this.getConversation(id, user);

    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    return this.prisma.whatsappMessage.findMany({
      where: {
        organizationId:
          conversation.organizationId,
        conversationId: id,
      },

      orderBy: {
        createdAt: 'desc',
      },

      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async sendText(
    id: string,
    d: SendTextMessageDto,
    user: AuthenticatedUserRef,
  ) {
    const conversation: any =
      await this.getConversation(id, user);

    if (
      !this.windowPolicy.canSendFreeMessage(
        conversation.customerServiceWindowEndsAt,
      )
    ) {
      throw new BadRequestException(
        'WHATSAPP_CUSTOMER_SERVICE_WINDOW_CLOSED',
      );
    }

    return this.sendOutbound(
      conversation,
      d,
      user,
      'TEXT',
    );
  }

  async sendMedia(
    id: string,
    d: SendMediaMessageDto,
    user: AuthenticatedUserRef,
  ) {
    const conversation: any =
      await this.getConversation(id, user);

    if (
      !this.windowPolicy.canSendFreeMessage(
        conversation.customerServiceWindowEndsAt,
      )
    ) {
      throw new BadRequestException(
        'WHATSAPP_CUSTOMER_SERVICE_WINDOW_CLOSED',
      );
    }

    return this.sendOutbound(
      conversation,
      d,
      user,
      'MEDIA',
    );
  }

  async sendTemplate(
    id: string,
    d: SendTemplateMessageDto,
    user: AuthenticatedUserRef,
  ) {
    const conversation: any =
      await this.getConversation(id, user);

    const template: any =
      await this.prisma.whatsappTemplate.findFirst({
        where: {
          id: d.templateId,
          organizationId:
            conversation.organizationId,
          whatsappAccountId:
            conversation.whatsappAccountId,
          deletedAt: null,
        },
      });

    if (
      !template ||
      template.status !== 'APPROVED'
    ) {
      throw new BadRequestException(
        'WHATSAPP_TEMPLATE_NOT_APPROVED',
      );
    }

    return this.sendOutbound(
      conversation,
      {
        ...d,
        template,
      },
      user,
      'TEMPLATE',
    );
  }

  private async sendOutbound(
    conversation: any,
    d: any,
    user: AuthenticatedUserRef,
    kind: 'TEXT' | 'TEMPLATE' | 'MEDIA',
  ) {
    const account: any =
      await this.accountInOrg(
        conversation.whatsappAccountId,
        conversation.organizationId,
        true,
      );

    const message =
      await this.prisma.whatsappMessage.create({
        data: {
          organizationId:
            conversation.organizationId,

          whatsappAccountId:
            account.id,

          conversationId:
            conversation.id,

          leadId:
            conversation.leadId,

          direction:
            'OUTBOUND' as never,

          type:
            (kind === 'MEDIA'
              ? d.type.toUpperCase()
              : kind) as never,

          status:
            'PENDING' as never,

          senderPhone:
            account.normalizedPhone,

          recipientPhone:
            conversation.normalizedPhone,

          text: d.text,
          mediaId: d.mediaId,

          templateName:
            d.template?.name,

          templateLanguage:
            d.template?.language,

          replyToExternalMessageId:
            d.replyToExternalMessageId,

          createdByUserId:
            user.id,
        },
      });

    try {
      const accessToken =
        await this.validAccessToken(account);

      const result =
        kind === 'TEXT'
          ? await this.meta.sendText({
              accessToken,
              phoneNumberId:
                account.phoneNumberId,
              to: conversation.normalizedPhone.replace(
                '+',
                '',
              ),
              text: d.text,
              replyToExternalMessageId:
                d.replyToExternalMessageId,
            })
          : kind === 'TEMPLATE'
            ? await this.meta.sendTemplate({
                accessToken,
                phoneNumberId:
                  account.phoneNumberId,
                to: conversation.normalizedPhone.replace(
                  '+',
                  '',
                ),
                name:
                  d.template.name,
                language:
                  d.template.language,
                components:
                  d.components,
              })
            : await this.meta.sendMedia({
                accessToken,
                phoneNumberId:
                  account.phoneNumberId,
                to: conversation.normalizedPhone.replace(
                  '+',
                  '',
                ),
                type: d.type,
                mediaId:
                  d.mediaId,
                caption:
                  d.caption,
              });

      const updated =
        await this.prisma.whatsappMessage.update({
          where: {
            id: message.id,
          },

          data: {
            externalMessageId:
              result.externalMessageId,

            status:
              'SENT' as never,

            sentAt:
              new Date(),
          },
        });

      await this.prisma.whatsappConversation.update({
        where: {
          id: conversation.id,
        },

        data: {
          lastMessageAt:
            new Date(),

          lastOutboundAt:
            new Date(),
        },
      });

      await this.auditSafe(
        conversation.organizationId,
        'whatsapp.message.sent',
        'WhatsappMessage',
        message.id,
        user.id,
        null,
        {
          id: message.id,
          status: 'SENT',
        },
      );

      return updated;
    } catch (e) {
      const err = sanitizeError(e);

      await this.prisma.whatsappMessage.update({
        where: {
          id: message.id,
        },

        data: {
          status:
            'FAILED' as never,

          errorMessage:
            err,

          failedAt:
            new Date(),
        },
      });

      await this.auditSafe(
        conversation.organizationId,
        'whatsapp.message.failed',
        'WhatsappMessage',
        message.id,
        user.id,
        null,
        {
          id: message.id,
          errorMessage: err,
        },
      );

      throw new BadRequestException({
        code:
          'WHATSAPP_META_SEND_FAILED',
        message:
          err,
      });
    }
  }

  async findTemplates(
    q: ListWhatsappTemplatesDto,
    user: AuthenticatedUserRef,
  ) {
    const ctx =
      await this.access.resolve(user);

    const org =
      this.scope(ctx);

    const page =
      Math.max(1, q.page ?? 1);

    const pageSize =
      Math.min(
        100,
        q.pageSize ?? q.limit ?? 20,
      );

    const includeArchived =
      q.state === 'archived' ||
      q.state === 'all' ||
      q.archived === 'true';

    const where: Prisma.WhatsappTemplateWhereInput = {
      organizationId: org,

      ...(includeArchived
        ? {}
        : {
            deletedAt: null,
            archivedAt: null,
          }),

      ...(q.state === 'archived'
        ? {
            OR: [
              {
                deletedAt: {
                  not: null,
                },
              },
              {
                archivedAt: {
                  not: null,
                },
              },
            ],
          }
        : {}),

      ...(q.state === 'active'
        ? {
            isActive: true,
          }
        : {}),

      ...(q.state === 'inactive'
        ? {
            isActive: false,
          }
        : {}),

      ...(q.status
        ? {
            status:
              q.status as never,
          }
        : {}),

      ...(q.category
        ? {
            category:
              q.category,
          }
        : {}),

      ...(q.language
        ? {
            language:
              q.language,
          }
        : {}),

      ...(q.search
        ? {
            OR: [
              {
                name: {
                  contains:
                    q.search,
                  mode:
                    'insensitive',
                },
              },
              {
                displayName: {
                  contains:
                    q.search,
                  mode:
                    'insensitive',
                },
              },
              {
                metaName: {
                  contains:
                    q.search,
                  mode:
                    'insensitive',
                },
              },
              {
                body: {
                  contains:
                    q.search,
                  mode:
                    'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] =
      await this.prisma.$transaction([
        this.prisma.whatsappTemplate.findMany({
          where,
          orderBy: {
            updatedAt: 'desc',
          },
          skip:
            (page - 1) * pageSize,
          take:
            pageSize,
        }),

        this.prisma.whatsappTemplate.count({
          where,
        }),
      ]);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages:
        Math.max(
          1,
          Math.ceil(total / pageSize),
        ),
    };
  }

  async getTemplate(
    id: string,
    user: AuthenticatedUserRef,
    withDeleted = false,
  ) {
    const ctx =
      await this.access.resolve(user);

    const template =
      await this.prisma.whatsappTemplate.findFirst({
        where: {
          id,
          organizationId:
            this.scope(ctx),

          ...(withDeleted
            ? {}
            : {
                deletedAt: null,
              }),
        },
      });

    if (!template) {
      throw new NotFoundException(
        'Template não encontrado',
      );
    }

    return template;
  }

  async createTemplate(
    d: CreateWhatsappTemplateDto,
    user: AuthenticatedUserRef,
  ) {
    const ctx =
      await this.access.resolve(user);

    const org =
      this.scope(ctx);

    await this.validateTemplateAccount(
      org,
      d.whatsappAccountId,
    );

    this.validateTemplate(
      d.name,
      d.metaName,
      d.body,
      d.headerType,
      d.headerText,
    );

    const created =
      await this.prisma.whatsappTemplate.create({
        data: {
          organizationId:
            org,

          whatsappAccountId:
            d.whatsappAccountId || null,

          name:
            d.name.trim(),

          displayName:
            d.displayName.trim(),

          metaName:
            d.metaName.trim(),

          language:
            d.language,

          category:
            d.category,

          status:
            (d.status ||
              'DRAFT') as never,

          headerType:
            d.headerType || 'NONE',

          headerText:
            d.headerText?.trim() ||
            null,

          body:
            d.body.trim(),

          footer:
            d.footer?.trim() ||
            null,

          buttons:
            (d.buttons ??
              []) as Prisma.InputJsonValue,

          components:
            this.toComponents(
              d,
            ) as Prisma.InputJsonValue,

          externalTemplateId:
            d.metaTemplateId?.trim() ||
            null,

          metaTemplateId:
            d.metaTemplateId?.trim() ||
            null,

          isActive:
            d.isActive ?? true,
        },
      });

    await this.auditSafe(
      org,
      'whatsapp.template.created',
      'WhatsappTemplate',
      created.id,
      ctx.id,
      null,
      created,
    );

    return created;
  }

  async updateTemplate(
    id: string,
    d: UpdateWhatsappTemplateDto,
    user: AuthenticatedUserRef,
  ) {
    const ctx =
      await this.access.resolve(user);

    const org =
      this.scope(ctx);

    const current =
      await this.getTemplate(
        id,
        user,
      );

    await this.validateTemplateAccount(
      org,
      d.whatsappAccountId === undefined
        ? undefined
        : d.whatsappAccountId ||
            undefined,
    );

    this.validateTemplate(
      d.name ?? current.name,
      d.metaName ??
        (current as any).metaName,
      d.body ??
        (current as any).body,
      d.headerType ??
        (current as any).headerType,
      d.headerText === undefined
        ? (current as any).headerText
        : d.headerText ||
          undefined,
    );

    const merged = {
      headerType:
        d.headerType ??
        (current as any).headerType,

      headerText:
        d.headerText === undefined
          ? (current as any).headerText
          : d.headerText,

      body:
        d.body ??
        (current as any).body,

      footer:
        d.footer === undefined
          ? (current as any).footer
          : d.footer,

      buttons:
        d.buttons === undefined
          ? (current as any).buttons
          : d.buttons,
    };

    const updated =
      await this.prisma.whatsappTemplate.update({
        where: {
          id,
        },

        data: {
          whatsappAccountId:
            d.whatsappAccountId === undefined
              ? undefined
              : d.whatsappAccountId ||
                null,

          name:
            d.name?.trim(),

          displayName:
            d.displayName?.trim(),

          metaName:
            d.metaName?.trim(),

          language:
            d.language,

          category:
            d.category,

          status:
            d.status as never,

          headerType:
            d.headerType,

          headerText:
            d.headerText === undefined
              ? undefined
              : d.headerText?.trim() ||
                null,

          body:
            d.body?.trim(),

          footer:
            d.footer === undefined
              ? undefined
              : d.footer?.trim() ||
                null,

          buttons:
            d.buttons === undefined
              ? undefined
              : (d.buttons as Prisma.InputJsonValue),

          components:
            this.toComponents(
              merged,
            ) as Prisma.InputJsonValue,

          externalTemplateId:
            d.metaTemplateId === undefined
              ? undefined
              : d.metaTemplateId?.trim() ||
                null,

          metaTemplateId:
            d.metaTemplateId === undefined
              ? undefined
              : d.metaTemplateId?.trim() ||
                null,

          isActive:
            d.isActive,
        },
      });

    await this.auditSafe(
      org,
      'whatsapp.template.updated',
      'WhatsappTemplate',
      id,
      ctx.id,
      current,
      updated,
    );

    return updated;
  }

  async archiveTemplate(
    id: string,
    user: AuthenticatedUserRef,
  ) {
    const ctx =
      await this.access.resolve(user);

    const current =
      await this.getTemplate(
        id,
        user,
      );

    const updated =
      await this.prisma.whatsappTemplate.update({
        where: {
          id,
        },

        data: {
          archivedAt:
            new Date(),

          isActive:
            false,
        },
      });

    await this.auditSafe(
      current.organizationId,
      'whatsapp.template.archived',
      'WhatsappTemplate',
      id,
      ctx.id,
      current,
      updated,
    );

    return updated;
  }

  async restoreTemplate(
    id: string,
    user: AuthenticatedUserRef,
  ) {
    const ctx =
      await this.access.resolve(user);

    const org =
      this.scope(ctx);

    const current =
      await this.prisma.whatsappTemplate.findFirst({
        where: {
          id,
          organizationId:
            org,

          OR: [
            {
              deletedAt: {
                not: null,
              },
            },
            {
              archivedAt: {
                not: null,
              },
            },
          ],
        },
      });

    if (!current) {
      throw new NotFoundException(
        'Template arquivado não encontrado',
      );
    }

    const updated =
      await this.prisma.whatsappTemplate.update({
        where: {
          id,
        },

        data: {
          deletedAt:
            null,

          archivedAt:
            null,

          isActive:
            true,
        },
      });

    await this.auditSafe(
      org,
      'whatsapp.template.restored',
      'WhatsappTemplate',
      id,
      ctx.id,
      current,
      updated,
    );

    return updated;
  }

  async deleteTemplate(
    id: string,
    user: AuthenticatedUserRef,
  ) {
    const ctx =
      await this.access.resolve(user);

    const current =
      await this.getTemplate(
        id,
        user,
      );

    await this.prisma.whatsappTemplate.update({
      where: {
        id,
      },

      data: {
        deletedAt:
          new Date(),

        isActive:
          false,
      },
    });

    await this.auditSafe(
      current.organizationId,
      'whatsapp.template.deleted',
      'WhatsappTemplate',
      id,
      ctx.id,
      current,
      {
        id,
        deletedAt: true,
      },
    );

    return {
      success: true,
    };
  }

  async syncTemplates(
    d: SyncWhatsappTemplatesDto,
    user: AuthenticatedUserRef,
  ) {
    const ctx =
      await this.access.resolve(user);

    const org =
      this.scope(ctx);

    const account: any =
      await this.accountInOrg(
        d.accountId,
        org,
        true,
      );

    const templates =
      await this.meta.syncTemplates({
        accessToken:
          await this.validAccessToken(
            account,
          ),

        businessAccountId:
          account.businessAccountId,
      });

    for (const template of templates) {
      await this.prisma.whatsappTemplate.upsert({
        where: {
          organizationId_whatsappAccountId_name_language:
            {
              organizationId:
                org,

              whatsappAccountId:
                account.id,

              name:
                template.name,

              language:
                template.language,
            },
        },

        update: {
          externalTemplateId:
            template.id,

          metaTemplateId:
            template.id,

          displayName:
            template.name,

          metaName:
            template.name,

          category:
            template.category,

          status:
            this.mapTemplateStatus(
              template.status,
            ) as never,

          components:
            template.components as Prisma.InputJsonValue,

          body:
            JSON.stringify(
              template.components,
            ),

          lastSyncedAt:
            new Date(),
        },

        create: {
          organizationId:
            org,

          whatsappAccountId:
            account.id,

          externalTemplateId:
            template.id,

          metaTemplateId:
            template.id,

          name:
            template.name,

          displayName:
            template.name,

          metaName:
            template.name,

          language:
            template.language,

          category:
            template.category,

          status:
            this.mapTemplateStatus(
              template.status,
            ) as never,

          body:
            JSON.stringify(
              template.components,
            ),

          components:
            template.components as Prisma.InputJsonValue,

          lastSyncedAt:
            new Date(),
        },
      });
    }

    await this.prisma.whatsappAccount.update({
      where: {
        id: account.id,
      },

      data: {
        lastSyncAt:
          new Date(),
      },
    });

    await this.auditSafe(
      org,
      'whatsapp.templates.synced',
      'WhatsappAccount',
      account.id,
      ctx.id,
      null,
      {
        count:
          templates.length,
      },
    );

    return {
      success: true,
      count:
        templates.length,
    };
  }

  private mapTemplateStatus(
    status?: string,
  ) {
    return status === 'APPROVED' ||
      status === 'REJECTED' ||
      status === 'DISABLED' ||
      status === 'PENDING' ||
      status === 'DRAFT'
      ? status
      : 'DISABLED';
  }

  private async validateTemplateAccount(
    org: string,
    accountId?: string,
  ) {
    if (!accountId) {
      return;
    }

    const account =
      await this.prisma.whatsappAccount.findFirst({
        where: {
          id: accountId,
          organizationId: org,
          deletedAt: null,
        },
      });

    if (!account) {
      throw new BadRequestException(
        'WHATSAPP_TEMPLATE_ACCOUNT_INVALID',
      );
    }
  }

  private validateTemplate(
    name: string,
    metaName: string,
    body: string,
    headerType?: string,
    headerText?: string | null,
  ) {
    if (!name?.trim()) {
      throw new BadRequestException(
        'Nome interno é obrigatório',
      );
    }

    if (
      !/^[a-z0-9_]+$/.test(
        metaName?.trim() || '',
      )
    ) {
      throw new BadRequestException(
        'Nome Meta deve usar apenas letras minúsculas, números e _',
      );
    }

    if (!body?.trim()) {
      throw new BadRequestException(
        'Body do template é obrigatório',
      );
    }

    if (
      headerType === 'TEXT' &&
      !headerText?.trim()
    ) {
      throw new BadRequestException(
        'Header de texto exige conteúdo',
      );
    }
  }

  private toComponents(d: any) {
    const components: any[] = [];

    if (
      d.headerType === 'TEXT' &&
      d.headerText
    ) {
      components.push({
        type: 'HEADER',
        format: 'TEXT',
        text: d.headerText,
      });
    }

    components.push({
      type: 'BODY',
      text: d.body,
    });

    if (d.footer) {
      components.push({
        type: 'FOOTER',
        text: d.footer,
      });
    }

    if (d.buttons?.length) {
      components.push({
        type: 'BUTTONS',
        buttons: d.buttons,
      });
    }

    return components;
  }

  async verifyWebhook(
    mode?: string,
    verifyToken?: string,
    challenge?: string,
  ) {
    if (
      mode !== 'subscribe' ||
      !verifyToken ||
      !challenge
    ) {
      throw new BadRequestException(
        'WHATSAPP_WEBHOOK_VERIFY_INVALID',
      );
    }

    const accounts =
      (await this.prisma.whatsappAccount.findMany({
        where: {
          deletedAt: null,
        },
      })) as any[];

    let found = false;

    for (const account of accounts) {
      if (!account.verifyToken) {
        continue;
      }

      try {
        const decrypted =
          this.crypto.decrypt(
            account.verifyToken,
          );

        if (decrypted === verifyToken) {
          found = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!found) {
      throw new UnauthorizedException(
        'WHATSAPP_WEBHOOK_VERIFY_TOKEN_INVALID',
      );
    }

    return challenge;
  }

  validateSignature(
    raw: Buffer,
    signature: string | undefined,
    appSecret: string | undefined,
  ) {
    if (!appSecret) {
      return;
    }

    if (
      !signature?.startsWith('sha256=')
    ) {
      throw new UnauthorizedException(
        'WHATSAPP_WEBHOOK_SIGNATURE_INVALID',
      );
    }

    const expected =
      'sha256=' +
      createHmac(
        'sha256',
        appSecret,
      )
        .update(raw)
        .digest('hex');

    if (
      !timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(signature),
      )
    ) {
      throw new UnauthorizedException(
        'WHATSAPP_WEBHOOK_SIGNATURE_INVALID',
      );
    }
  }

  async receiveWebhook(
    payload: any,
    raw: Buffer,
    signature?: string,
  ) {
    const changes =
      payload?.entry?.flatMap(
        (entry: any) =>
          entry.changes || [],
      ) || [];

    for (const change of changes) {
      const value =
        change.value || {};

      const phoneNumberId =
        value.metadata?.phone_number_id;

      const account: any =
        await this.prisma.whatsappAccount.findFirst({
          where: {
            deletedAt: null,

            OR: [
              {
                phoneNumberId,
              },
              {
                businessAccountId:
                  value.metadata
                    ?.business_account_id ||
                  '',
              },
            ],
          },
        });

      if (!account) {
        continue;
      }

      this.validateSignature(
        raw,
        signature,
        account.appSecret
          ? this.crypto.decrypt(
              account.appSecret,
            )
          : undefined,
      );

      await this.processValue(
        account,
        value,
      );
    }

    return {
      success: true,
    };
  }

  private async processValue(
    account: any,
    value: any,
  ) {
    for (const message of value.messages || []) {
      await this.processInbound(
        account,
        value,
        message,
      );
    }

    for (const status of value.statuses || []) {
      await this.processStatus(
        account,
        status,
      );
    }
  }

  private async createEvent(
    account: any,
    type: string,
    key: string,
    externalMessageId?: string,
    payload?: unknown,
  ) {
    try {
      return await this.prisma.whatsappWebhookEvent.create({
        data: {
          organizationId:
            account.organizationId,

          whatsappAccountId:
            account.id,

          eventType:
            type,

          deduplicationKey:
            key,

          externalMessageId,

          sanitizedPayload:
            redactSecrets(
              payload,
            ) as Prisma.InputJsonValue,
        },
      });
    } catch {
      return null;
    }
  }

  private async processInbound(
    account: any,
    value: any,
    message: any,
  ) {
    const key =
      message.id ||
      createHash('sha256')
        .update(
          JSON.stringify(message),
        )
        .digest('hex');

    const event =
      await this.createEvent(
        account,
        'message',
        key,
        message.id,
        {
          id: message.id,
          type: message.type,
        },
      );

    if (!event) {
      return;
    }

    const phone =
      this.normalizePhone(
        message.from,
      );

    const contact =
      value.contacts?.find(
        (candidate: any) =>
          candidate.wa_id ===
          message.from,
      );

    const lead =
      await this.findOrCreateLead(
        account.organizationId,
        phone,
        contact?.profile?.name,
      );

    const now =
      new Date(
        Number(
          message.timestamp ||
            Date.now() / 1000,
        ) * 1000,
      );

    const windowEndsAt =
      this.windowPolicy.windowEndsAt(
        now,
      );

    let conversation: any =
      await this.prisma.whatsappConversation.findFirst({
        where: {
          whatsappAccountId:
            account.id,

          normalizedPhone:
            phone,

          deletedAt:
            null,
        },
      });

    if (conversation) {
      conversation =
        await this.prisma.whatsappConversation.update({
          where: {
            id: conversation.id,
          },

          data: {
            leadId:
              lead.id,

            contactName:
              contact?.profile?.name,

            lastMessageAt:
              now,

            lastInboundAt:
              now,

            customerServiceWindowEndsAt:
              windowEndsAt,

            status:
              'OPEN' as never,

            unreadCount: {
              increment: 1,
            },
          },
        });
    } else {
      conversation =
        await this.prisma.whatsappConversation.create({
          data: {
            organizationId:
              account.organizationId,

            whatsappAccountId:
              account.id,

            leadId:
              lead.id,

            contactPhone:
              message.from,

            normalizedPhone:
              phone,

            contactName:
              contact?.profile?.name,

            lastMessageAt:
              now,

            lastInboundAt:
              now,

            customerServiceWindowEndsAt:
              windowEndsAt,

            unreadCount:
              1,
          },
        });
    }

    await this.prisma.whatsappMessage.upsert({
      where: {
        organizationId_externalMessageId:
          {
            organizationId:
              account.organizationId,

            externalMessageId:
              message.id,
          },
      },

      update: {},

      create: {
        organizationId:
          account.organizationId,

        whatsappAccountId:
          account.id,

        conversationId:
          conversation.id,

        leadId:
          lead.id,

        externalMessageId:
          message.id,

        direction:
          'INBOUND' as never,

        type:
          this.mapType(
            message.type,
          ) as never,

        status:
          'RECEIVED' as never,

        senderPhone:
          phone,

        recipientPhone:
          account.normalizedPhone,

        text:
          message.text?.body,

        mediaId:
          message.image?.id ||
          message.document?.id ||
          message.audio?.id ||
          message.video?.id,

        mimeType:
          message.image?.mime_type ||
          message.document?.mime_type ||
          message.audio?.mime_type ||
          message.video?.mime_type,

        fileName:
          message.document?.filename,

        metadata:
          redactSecrets({
            location:
              message.location,

            interactive:
              message.interactive,

            contacts:
              message.contacts,

            unknown:
              message.type &&
              ![
                'text',
                'image',
                'document',
                'audio',
                'video',
                'location',
                'interactive',
                'contacts',
              ].includes(
                message.type,
              )
                ? message
                : undefined,
          }) as Prisma.InputJsonValue,

        createdAt:
          now,
      },
    });

    await this.prisma.whatsappWebhookEvent.update({
      where: {
        id: event.id,
      },

      data: {
        status:
          'PROCESSED' as never,

        processedAt:
          new Date(),
      },
    });
  }

  private async processStatus(
    account: any,
    statusPayload: any,
  ) {
    const key =
      `${statusPayload.id}:${statusPayload.status}:${statusPayload.timestamp || ''}`;

    const event =
      await this.createEvent(
        account,
        'status',
        key,
        statusPayload.id,
        {
          id:
            statusPayload.id,

          status:
            statusPayload.status,

          errors:
            statusPayload.errors,
        },
      );

    if (!event) {
      return;
    }

    const message: any =
      await this.prisma.whatsappMessage.findFirst({
        where: {
          organizationId:
            account.organizationId,

          externalMessageId:
            statusPayload.id,
        },
      });

    if (message) {
      const status =
        this.mapStatus(
          statusPayload.status,
        );

      if (
        statusRank[status] >=
          statusRank[message.status] ||
        status === 'FAILED'
      ) {
        await this.prisma.whatsappMessage.update({
          where: {
            id: message.id,
          },

          data: {
            status:
              status as never,

            deliveredAt:
              status === 'DELIVERED'
                ? new Date()
                : undefined,

            readAt:
              status === 'READ'
                ? new Date()
                : undefined,

            failedAt:
              status === 'FAILED'
                ? new Date()
                : undefined,

            errorCode:
              statusPayload.errors?.[0]?.code?.toString(),

            errorMessage:
              statusPayload.errors?.[0]?.title?.slice(
                0,
                500,
              ),
          },
        });

        await this.updateDistributionFromWhatsappMessage(
          message,
          status,
          statusPayload.errors?.[0]?.title,
        );
      }
    }

    await this.prisma.whatsappWebhookEvent.update({
      where: {
        id: event.id,
      },

      data: {
        status:
          'PROCESSED' as never,

        processedAt:
          new Date(),
      },
    });
  }

  private async updateDistributionFromWhatsappMessage(
    message: any,
    status: string,
    errorMessage?: string,
  ) {
    const distributionId =
      message.metadata?.distributionId;

    if (!distributionId) {
      return;
    }

    await this.prisma.leadDistribution
      .update({
        where: {
          id: distributionId,
        },

        data: {
          status:
            status === 'FAILED'
              ? ('FAILED' as never)
              : status === 'DELIVERED'
                ? ('DELIVERED' as never)
                : status === 'READ'
                  ? ('READ' as never)
                  : ('CONTACT_SENT' as never),

          errorMessage:
            errorMessage?.slice(
              0,
              500,
            ) ?? null,
        },
      })
      .catch(() => undefined);
  }

  private mapType(type: string) {
    return (
      {
        text: 'TEXT',
        image: 'IMAGE',
        document: 'DOCUMENT',
        audio: 'AUDIO',
        video: 'VIDEO',
        location: 'LOCATION',
        interactive: 'INTERACTIVE',
        contacts: 'CONTACTS',
      } as any
    )[type] || 'UNKNOWN';
  }

  private mapStatus(status: string) {
    return (
      {
        sent: 'SENT',
        delivered: 'DELIVERED',
        read: 'READ',
        failed: 'FAILED',
      } as any
    )[status] || 'SENT';
  }

  private async findOrCreateLead(
    org: string,
    phone: string,
    name?: string,
  ) {
    const existing =
      await this.prisma.lead.findFirst({
        where: {
          organizationId:
            org,

          normalizedPhone:
            phone,

          deletedAt:
            null,
        },
      });

    if (existing) {
      return existing;
    }

    const lead =
      await this.prisma.lead.create({
        data: {
          organizationId:
            org,

          phone,

          normalizedPhone:
            phone,

          name:
            name || null,

          source:
            'WHATSAPP' as never,

          createdByUserId:
            null,

          lastInteractionAt:
            new Date(),
        },
      });

    await this.prisma.leadEvent
      .create({
        data: {
          organizationId:
            org,

          leadId:
            lead.id,

          eventType:
            'LEAD_CREATED' as never,

          description:
            'Lead criado automaticamente por mensagem WhatsApp oficial',

          idempotencyKey:
            `whatsapp-auto-lead:${org}:${phone}`,

          payload: {
            source:
              'WHATSAPP',
          },
        },
      })
      .catch(() => undefined);

    return lead;
  }

  private async ensureUser(
    org: string,
    userId: string,
  ) {
    const user =
      await this.prisma.user.findFirst({
        where: {
          id:
            userId,

          organizationId:
            org,

          status:
            'ACTIVE',

          deletedAt:
            null,
        },
      });

    if (!user) {
      throw new BadRequestException(
        'WHATSAPP_USER_NOT_IN_ORGANIZATION',
      );
    }
  }
}