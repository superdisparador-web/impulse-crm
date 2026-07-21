import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from '../auth/auth-user';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { ListLeadsDto } from './dto/list-leads.dto';
import { MoveLeadDto } from './dto/move-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { UpdateLeadTemperatureDto } from './dto/update-lead-temperature.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsService } from './leads.service';

@UseGuards(AuthGuard('jwt'))
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}
  @Get() findAll(@Query() query: ListLeadsDto, @Req() req: AuthRequest) { return this.leadsService.findAll(this.getOrganizationId(req), query); }
  @Get(':id') findOne(@Param('id') id: string, @Req() req: AuthRequest) { return this.leadsService.findOne(this.getOrganizationId(req), id); }
  @Post() create(@Body() data: CreateLeadDto, @Req() req: AuthRequest) { return this.leadsService.create(this.getOrganizationId(req), data, req.user?.id); }
  @Patch(':id') update(@Param('id') id: string, @Body() data: UpdateLeadDto, @Req() req: AuthRequest) { return this.leadsService.update(this.getOrganizationId(req), id, data, req.user?.id); }
  @Patch(':id/assign') assign(@Param('id') id: string, @Body() data: AssignLeadDto, @Req() req: AuthRequest) { return this.leadsService.assign(this.getOrganizationId(req), id, data.assignedUserId ?? null, req.user?.id); }
  @Patch(':id/status') updateStatus(@Param('id') id: string, @Body() data: UpdateLeadStatusDto, @Req() req: AuthRequest) { return this.leadsService.updateStatus(this.getOrganizationId(req), id, data.status, req.user?.id); }
  @Patch(':id/move') move(@Param('id') id: string, @Body() data: MoveLeadDto, @Req() req: AuthRequest) { return this.leadsService.move(id, this.getOrganizationId(req), data.stageId, req.user?.id); }
  @Patch(':id/temperature') updateTemperature(@Param('id') id: string, @Body() data: UpdateLeadTemperatureDto, @Req() req: AuthRequest) { return this.leadsService.updateTemperature(this.getOrganizationId(req), id, data.temperature, req.user?.id); }
  @Delete(':id') remove(@Param('id') id: string, @Req() req: AuthRequest) { return this.leadsService.remove(this.getOrganizationId(req), id, req.user?.id); }

  private getOrganizationId(req: AuthRequest) {
    if (!req.user?.organizationId) throw new ForbiddenException('Usuário autenticado não possui organização vinculada');
    return req.user.organizationId;
  }
}
