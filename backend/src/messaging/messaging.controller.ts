import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMessageQueueDto } from './dto/create-message-queue.dto';
import { ListMessageLogsDto } from './dto/list-message-logs.dto';
import { ListMessageQueuesDto } from './dto/list-message-queues.dto';
import { MessagingService } from './messaging.service';

type AuthRequest = Request & { user?: { id?: string } };
@UseGuards(JwtAuthGuard)
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}
  private userId(req: AuthRequest) { return req.user?.id ?? ''; }
  @Get('queues') queues(@Req() req: AuthRequest, @Query() query: ListMessageQueuesDto) { return this.messagingService.findAll(this.userId(req), query); }
  @Get('queues/:id') queue(@Req() req: AuthRequest, @Param('id') id: string) { return this.messagingService.findOne(this.userId(req), id); }
  @Post('queues') create(@Req() req: AuthRequest, @Body() data: CreateMessageQueueDto) { return this.messagingService.enqueueCampaign(this.userId(req), data); }
  @Post('queues/:id/start') start(@Req() req: AuthRequest, @Param('id') id: string) { return this.messagingService.startQueue(this.userId(req), id); }
  @Post('queues/:id/pause') pause(@Req() req: AuthRequest, @Param('id') id: string) { return this.messagingService.pauseQueue(this.userId(req), id); }
  @Post('queues/:id/resume') resume(@Req() req: AuthRequest, @Param('id') id: string) { return this.messagingService.resumeQueue(this.userId(req), id); }
  @Post('queues/:id/cancel') cancel(@Req() req: AuthRequest, @Param('id') id: string) { return this.messagingService.cancelQueue(this.userId(req), id); }
  @Post('queues/:id/retry') retry(@Req() req: AuthRequest, @Param('id') id: string) { return this.messagingService.retryFailed(this.userId(req), id); }
  @Get('logs') logs(@Req() req: AuthRequest, @Query() query: ListMessageLogsDto) { return this.messagingService.logs(this.userId(req), query); }
  @Get('logs/:id') log(@Req() req: AuthRequest, @Param('id') id: string) { return this.messagingService.log(this.userId(req), id); }
}
