import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { ListLeadActivitiesDto } from './dto/list-lead-activities.dto';
import { ListLeadsDto } from './dto/list-leads.dto';
import { UpdateLeadActivityDto } from './dto/update-lead-activity.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { UpdateLeadTemperatureDto } from './dto/update-lead-temperature.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { SetLeadManagerDto } from './dto/set-lead-manager.dto';
import { LeadsService } from './leads.service';

type AuthRequest = Request & { user?: { id: string; role?: string } };

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}
  @Get('duplicates') @Permissions('leads:manage-duplicates') duplicates(@Query() query: ListLeadsDto, @Req() req: AuthRequest) { return this.leadsService.duplicates(query, req.user!); }
  @Get() @Permissions('leads:read') findAll(@Query() query: ListLeadsDto, @Req() req: AuthRequest) { return this.leadsService.findAll(query, req.user!); }
  @Get(':id') @Permissions('leads:read') findOne(@Param('id') id: string, @Req() req: AuthRequest) { return this.leadsService.findOne(id, req.user!); }
  @Get(':id/timeline') @Permissions('leads:history:read') timeline(@Param('id') id: string, @Req() req: AuthRequest) { return this.leadsService.getTimeline(id, req.user!); }
  @Post() @Permissions('leads:create') create(@Body() data: CreateLeadDto, @Req() req: AuthRequest) { return this.leadsService.create(data, req.user!); }
  @Patch(':id') @Permissions('leads:update') update(@Param('id') id: string, @Body() data: UpdateLeadDto, @Req() req: AuthRequest) { return this.leadsService.update(id, data, req.user!); }
  @Patch(':id/assign') @Permissions('leads:assign') assign(@Param('id') id: string, @Body() data: AssignLeadDto, @Req() req: AuthRequest) { return this.leadsService.assign(id, data.assignedUserId ?? null, req.user!); }
  @Patch(':id/status') @Permissions('leads:update') updateStatus(@Param('id') id: string, @Body() data: UpdateLeadStatusDto, @Req() req: AuthRequest) { return this.leadsService.updateStatus(id, data.status, req.user!); }
  @Patch(':id/temperature') @Permissions('leads:update') updateTemperature(@Param('id') id: string, @Body() data: UpdateLeadTemperatureDto, @Req() req: AuthRequest) { return this.leadsService.updateTemperature(id, data.temperature, req.user!); }
  @Get(':id/history') @Permissions('leads:history:read') history(@Param('id') id: string, @Req() req: AuthRequest) { return this.leadsService.history(id, req.user!); }
  @Patch(':id/unassign') @Permissions('leads:unassign') unassign(@Param('id') id: string, @Req() req: AuthRequest) { return this.leadsService.assign(id, null, req.user!); }
  @Patch(':id/manager') @Permissions('leads:assign') manager(@Param('id') id: string, @Body() data: SetLeadManagerDto, @Req() req: AuthRequest) { return this.leadsService.setManager(id, data.managerUserId ?? null, req.user!); }
  @Patch(':id/archive') @Permissions('leads:archive') archive(@Param('id') id: string, @Req() req: AuthRequest) { return this.leadsService.remove(id, req.user!); }
  @Patch(':id/restore') @Permissions('leads:restore') restore(@Param('id') id: string, @Req() req: AuthRequest) { return this.leadsService.restore(id, req.user!); }
  @Get(':id/activities') @Permissions('leads:read') activities(@Param('id') id: string, @Query() query: ListLeadActivitiesDto, @Req() req: AuthRequest) { return this.leadsService.listActivities(id, query, req.user!); }
  @Post(':id/activities') @Permissions('leads:update') createActivity(@Param('id') id: string, @Body() data: CreateLeadActivityDto, @Req() req: AuthRequest) { return this.leadsService.createActivity(id, data, req.user!); }
  @Patch(':id/activities/:activityId') @Permissions('leads:update') updateActivity(@Param('id') id: string, @Param('activityId') activityId: string, @Body() data: UpdateLeadActivityDto, @Req() req: AuthRequest) { return this.leadsService.updateActivity(id, activityId, data, req.user!); }
}
