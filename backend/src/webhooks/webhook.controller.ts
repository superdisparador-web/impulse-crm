import { Body, Controller, Get, Headers, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListWebhookOverviewDto } from './dto/list-webhook-overview.dto';
import { MetaWebhookService } from './meta-webhook.service';
import { WebhookService } from './webhook.service';

type AuthRequest = Request & { user?: { id?: string } };
type RawBodyRequest = Request & { rawBody?: Buffer };

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhooks: WebhookService, private readonly meta: MetaWebhookService, private readonly config: ConfigService) {}

  @Get('meta')
  verifyMeta(@Query('hub.mode') mode?: string, @Query('hub.verify_token') token?: string, @Query('hub.challenge') challenge?: string) { return this.meta.verify(mode, token, challenge); }

  @Post('meta')
  receiveMeta(@Body() payload: unknown, @Headers('x-hub-signature-256') signature?: string, @Req() request?: RawBodyRequest) {
    const valid = this.meta.validateSignature(signature, request?.rawBody, this.config.get<string>('META_APP_SECRET'));
    return this.meta.process(payload, valid);
  }

  @UseGuards(JwtAuthGuard)
  @Get('health')
  health() { return this.webhooks.health(); }

  @UseGuards(JwtAuthGuard)
  @Get()
  overview(@Req() req: AuthRequest, @Query() query: ListWebhookOverviewDto) { return this.webhooks.overview(req.user?.id ?? '', query); }
}
