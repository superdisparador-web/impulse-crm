import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto, EntityMetricsQueryDto } from './dto/analytics-query.dto';
import { RecordAnalyticsEventDto } from './dto/record-analytics-event.dto';

type AuthRequest = Request & { user?: { id: string; role?: string } };

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('daily') daily(@Query() query: AnalyticsQueryDto, @Req() req: AuthRequest) { return this.analyticsService.daily(query, req.user!); }
  @Get('hourly') hourly(@Query() query: AnalyticsQueryDto, @Req() req: AuthRequest) { return this.analyticsService.hourly(query, req.user!); }
  @Get('campaigns') campaigns(@Query() query: EntityMetricsQueryDto, @Req() req: AuthRequest) { return this.analyticsService.campaigns(query, req.user!); }
  @Get('brokers') brokers(@Query() query: EntityMetricsQueryDto, @Req() req: AuthRequest) { return this.analyticsService.brokers(query, req.user!); }
  @Get('managers') managers(@Query() query: EntityMetricsQueryDto, @Req() req: AuthRequest) { return this.analyticsService.managers(query, req.user!); }
  @Get('whatsapp') whatsapp(@Query() query: EntityMetricsQueryDto, @Req() req: AuthRequest) { return this.analyticsService.whatsapp(query, req.user!); }
  @Post('events') recordEvent(@Body() data: RecordAnalyticsEventDto) { return this.analyticsService.recordEvent(data); }
}
