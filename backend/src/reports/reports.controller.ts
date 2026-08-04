import { Controller, Get, Header, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';

type AuthRequest = Request & { user?: { id?: string } };

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}
  @Get('export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="impulse-report.csv"')
  exportCsv(@Req() request: AuthRequest, @Query() query: Record<string, string>) { return this.service.exportCsv(request.user?.id ?? '', query); }
}
