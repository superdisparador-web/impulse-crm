import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportsService } from './reports.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('export.csv')
  @Permissions('analytics.dashboard.read')
  async csv(@Query() query: ReportQueryDto, @Req() req: Request & { user?: { id: string; role?: string } }, @Res() response: Response) {
    const content = await this.reports.csv(query, req.user!);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="impulse-${query.dataset}.csv"`);
    response.send(`\uFEFF${content}`);
  }
}
