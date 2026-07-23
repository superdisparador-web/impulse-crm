import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUserRef } from '../auth/access-context.service';
import { AssignConversationDto, UpdateConversationDto } from './dto/conversations.dto';
import { CreateWhatsappAccountDto } from './dto/create-whatsapp-account.dto';
import { ListWhatsappDto } from './dto/list-whatsapp.dto';
import { SendMediaMessageDto, SendTemplateMessageDto, SendTextMessageDto } from './dto/messages.dto';
import { SyncWhatsappTemplatesDto } from './dto/sync-whatsapp-templates.dto';
import { UpdateWhatsappAccountDto, UpdateWhatsappAccountStatusDto } from './dto/update-whatsapp-account.dto';
import { WhatsappService } from './whatsapp.service';

type RawReq = Request & { rawBody?: Buffer };
@ApiTags('WhatsApp Oficial Meta')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly service: WhatsappService) {}
  @Post('accounts') @Permissions('whatsapp:accounts:create') createAccount(@Body() d: CreateWhatsappAccountDto, @CurrentUser() u: AuthenticatedUserRef) { return this.service.createAccount(d, u); }
  @Get('accounts') @Permissions('whatsapp:accounts:read') findAccounts(@Query() q: ListWhatsappDto, @CurrentUser() u: AuthenticatedUserRef) { return this.service.findAccounts(q, u); }
  @Get('accounts/:id') @Permissions('whatsapp:accounts:read') getAccount(@Param('id') id: string, @CurrentUser() u: AuthenticatedUserRef) { return this.service.getAccount(id, u); }
  @Patch('accounts/:id') @Permissions('whatsapp:accounts:update') updateAccount(@Param('id') id: string, @Body() d: UpdateWhatsappAccountDto, @CurrentUser() u: AuthenticatedUserRef) { return this.service.updateAccount(id, d, u); }
  @Patch('accounts/:id/status') @Permissions('whatsapp:accounts:update') updateAccountStatus(@Param('id') id: string, @Body() d: UpdateWhatsappAccountStatusDto, @CurrentUser() u: AuthenticatedUserRef) { return this.service.updateAccountStatus(id, d, u); }
  @Patch('accounts/:id/default') @Permissions('whatsapp:accounts:update') setDefaultAccount(@Param('id') id: string, @CurrentUser() u: AuthenticatedUserRef) { return this.service.setDefaultAccount(id, u); }
  @Post('accounts/:id/test') @Permissions('whatsapp:accounts:test') testAccountPost(@Param('id') id: string, @CurrentUser() u: AuthenticatedUserRef) { return this.service.testAccount(id, u); }
  @Post('accounts/:id/sync') @Permissions('whatsapp:accounts:test') syncAccount(@Param('id') id: string, @CurrentUser() u: AuthenticatedUserRef) { return this.service.syncAccount(id, u); }
  @Delete('accounts/:id') @Permissions('whatsapp:accounts:archive') deleteAccount(@Param('id') id: string, @CurrentUser() u: AuthenticatedUserRef) { return this.service.archiveAccount(id, u); }
  @Patch('accounts/:id/archive') @Permissions('whatsapp:accounts:archive') archive(@Param('id') id: string, @CurrentUser() u: AuthenticatedUserRef) { return this.service.archiveAccount(id, u); }
  @Patch('accounts/:id/restore') @Permissions('whatsapp:accounts:archive') restore(@Param('id') id: string, @CurrentUser() u: AuthenticatedUserRef) { return this.service.restoreAccount(id, u); }
  @Get('conversations') @Permissions('whatsapp:conversations:read') conversations(@Query() q: ListWhatsappDto, @CurrentUser() u: AuthenticatedUserRef) { return this.service.listConversations(q, u); }
  @Get('conversations/:id') @Permissions('whatsapp:conversations:read') conversation(@Param('id') id: string, @CurrentUser() u: AuthenticatedUserRef) { return this.service.getConversation(id, u); }
  @Patch('conversations/:id') @Permissions('whatsapp:conversations:update') updateConversation(@Param('id') id: string, @Body() d: UpdateConversationDto, @CurrentUser() u: AuthenticatedUserRef) { return this.service.updateConversation(id, d, u); }
  @Patch('conversations/:id/assign') @Permissions('whatsapp:conversations:assign') assign(@Param('id') id: string, @Body() d: AssignConversationDto, @CurrentUser() u: AuthenticatedUserRef) { return this.service.assignConversation(id, d, u); }
  @Patch('conversations/:id/unassign') @Permissions('whatsapp:conversations:assign') unassign(@Param('id') id: string, @CurrentUser() u: AuthenticatedUserRef) { return this.service.assignConversation(id, { assignedUserId: null }, u); }
  @Patch('conversations/:id/close') @Permissions('whatsapp:conversations:update') close(@Param('id') id: string, @CurrentUser() u: AuthenticatedUserRef) { return this.service.closeConversation(id, u); }
  @Patch('conversations/:id/reopen') @Permissions('whatsapp:conversations:update') reopen(@Param('id') id: string, @CurrentUser() u: AuthenticatedUserRef) { return this.service.reopenConversation(id, u); }
  @Get('conversations/:id/messages') @Permissions('whatsapp:messages:read') messages(@Param('id') id: string, @Query() q: ListWhatsappDto, @CurrentUser() u: AuthenticatedUserRef) { return this.service.messages(id, q, u); }
  @Post('conversations/:id/messages/text') @Permissions('whatsapp:messages:send') sendText(@Param('id') id: string, @Body() d: SendTextMessageDto, @CurrentUser() u: AuthenticatedUserRef) { return this.service.sendText(id, d, u); }
  @Post('conversations/:id/messages/template') @Permissions('whatsapp:messages:send') sendTemplate(@Param('id') id: string, @Body() d: SendTemplateMessageDto, @CurrentUser() u: AuthenticatedUserRef) { return this.service.sendTemplate(id, d, u); }
  @Post('conversations/:id/messages/media') @Permissions('whatsapp:messages:send') sendMedia(@Param('id') id: string, @Body() d: SendMediaMessageDto, @CurrentUser() u: AuthenticatedUserRef) { return this.service.sendMedia(id, d, u); }
  @Get('templates') @Permissions('whatsapp:templates:read') templates(@Query() q: ListWhatsappDto, @CurrentUser() u: AuthenticatedUserRef) { return this.service.findTemplates(q, u); }
  @Get('templates/:id') @Permissions('whatsapp:templates:read') template(@Param('id') id: string, @CurrentUser() u: AuthenticatedUserRef) { return this.service.getTemplate(id, u); }
  @Post('templates/sync') @Permissions('whatsapp:templates:sync') sync(@Body() d: SyncWhatsappTemplatesDto, @CurrentUser() u: AuthenticatedUserRef) { return this.service.syncTemplates(d, u); }
}
@ApiTags('Webhooks WhatsApp Meta')
@Controller('webhooks/whatsapp')
export class WhatsappWebhookController {
  constructor(private readonly service: WhatsappService) {}
  @Get() verify(@Query('hub.mode') mode: string, @Query('hub.verify_token') token: string, @Query('hub.challenge') challenge: string) { return this.service.verifyWebhook(mode, token, challenge); }
  @Post() receive(@Body() payload: unknown, @Req() req: RawReq, @Headers('x-hub-signature-256') sig?: string) { return this.service.receiveWebhook(payload, req.rawBody || Buffer.from(JSON.stringify(payload || {})), sig); }
}
