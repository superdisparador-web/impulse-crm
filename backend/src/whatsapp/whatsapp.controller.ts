import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateWhatsappAccountDto } from './dto/create-whatsapp-account.dto';
import { ListWhatsappDto } from './dto/list-whatsapp.dto';
import { SyncWhatsappTemplatesDto } from './dto/sync-whatsapp-templates.dto';
import { UpdateWhatsappAccountDto } from './dto/update-whatsapp-account.dto';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @UseGuards(JwtAuthGuard)
  @Get('accounts')
  findAccounts(@Query() query: ListWhatsappDto) { return this.whatsappService.findAccounts(query); }

  @UseGuards(JwtAuthGuard)
  @Post('accounts')
  createAccount(@Body() data: CreateWhatsappAccountDto) { return this.whatsappService.createAccount(data); }

  @UseGuards(JwtAuthGuard)
  @Patch('accounts/:id')
  updateAccount(@Param('id') id: string, @Body() data: UpdateWhatsappAccountDto) { return this.whatsappService.updateAccount(id, data); }

  @UseGuards(JwtAuthGuard)
  @Delete('accounts/:id')
  removeAccount(@Param('id') id: string) { return this.whatsappService.removeAccount(id); }

  @UseGuards(JwtAuthGuard)
  @Get('templates')
  findTemplates(@Query() query: ListWhatsappDto) { return this.whatsappService.findTemplates(query); }

  @UseGuards(JwtAuthGuard)
  @Post('templates/sync')
  syncTemplates(@Body() data: SyncWhatsappTemplatesDto) { return this.whatsappService.syncTemplates(data); }

  @Get('webhook')
  verifyWebhook(@Query('hub.mode') mode: string, @Query('hub.verify_token') token: string, @Query('hub.challenge') challenge: string) {
    return this.whatsappService.verifyWebhook(mode, token, challenge);
  }

  @Post('webhook')
  receiveWebhook(@Body() payload: unknown) { return this.whatsappService.receiveWebhook(payload); }
}
