import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto, EntityMetricsQueryDto } from './dto/analytics-query.dto';
import { RecordAnalyticsEventDto } from './dto/record-analytics-event.dto';
import { AnalyticsInsightsService } from './analytics-insights.service';

type AuthRequest = Request & { user?: { id: string; role?: string } };

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService, private readonly insights: AnalyticsInsightsService) {}

  @Get('executive') @Permissions('analytics.dashboard.read') executive(@Query() query: AnalyticsQueryDto, @Req() req: AuthRequest) { return this.insights.executive(query, req.user!); }
  @Get('campaigns/:id/funnel') @Permissions('analytics.campaign.read') funnel(@Param('id') id: string, @Query() query: AnalyticsQueryDto, @Req() req: AuthRequest) { return this.insights.funnel(id, query, req.user!); }
  @Get('templates') @Permissions('analytics.campaign.read') templates(@Query() query: EntityMetricsQueryDto, @Req() req: AuthRequest) { return this.insights.templates(query, req.user!); }
  @Get('events') @Permissions('analytics.dashboard.read') events(@Query() query: EntityMetricsQueryDto, @Req() req: AuthRequest) { return this.insights.events(query, req.user!); }

  @Get('overview') @Permissions('analytics.dashboard.read') overview(@Query() query: AnalyticsQueryDto, @Req() req: AuthRequest) { return this.analyticsService.overview(query, req.user!); }
  @Get('daily') @Permissions('analytics.dashboard.read') daily(@Query() query: AnalyticsQueryDto, @Req() req: AuthRequest) { return this.analyticsService.daily(query, req.user!); }
  @Get('hourly') @Permissions('analytics.dashboard.read') hourly(@Query() query: AnalyticsQueryDto, @Req() req: AuthRequest) { return this.analyticsService.hourly(query, req.user!); }
  @Get('campaigns') @Permissions('analytics.campaign.read') campaigns(@Query() query: EntityMetricsQueryDto, @Req() req: AuthRequest) { return this.analyticsService.campaigns(query, req.user!); }
  @Get('brokers') @Permissions('analytics.broker.read') brokers(@Query() query: EntityMetricsQueryDto, @Req() req: AuthRequest) { return this.analyticsService.brokers(query, req.user!); }
  @Get('managers') @Permissions('analytics.manager.read') managers(@Query() query: EntityMetricsQueryDto, @Req() req: AuthRequest) { return this.analyticsService.managers(query, req.user!); }
  @Get('whatsapp') @Permissions('analytics.whatsapp.read') whatsapp(@Query() query: EntityMetricsQueryDto, @Req() req: AuthRequest) { return this.analyticsService.whatsapp(query, req.user!); }
  @Post('events') @Permissions('analytics.event.create') recordEvent(@Body() data: RecordAnalyticsEventDto) { return this.analyticsService.recordEvent(data); }
}
