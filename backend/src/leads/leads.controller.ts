import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { ListLeadActivitiesDto } from './dto/list-lead-activities.dto';
import { ListLeadsDto } from './dto/list-leads.dto';
import { UpdateLeadActivityDto } from './dto/update-lead-activity.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { UpdateLeadTemperatureDto } from './dto/update-lead-temperature.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsService } from './leads.service';

type AuthRequest = Request & { user?: { id: string; role?: Role } };

@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}
  @Get() findAll(@Query() query: ListLeadsDto, @Req() req: AuthRequest) { return this.leadsService.findAll(query, req.user!); }
  @Get(':id') findOne(@Param('id') id: string, @Req() req: AuthRequest) { return this.leadsService.findOne(id, req.user!); }
  @Get(':id/timeline') timeline(@Param('id') id: string, @Req() req: AuthRequest) { return this.leadsService.getTimeline(id, req.user!); }
  @Post() create(@Body() data: CreateLeadDto, @Req() req: AuthRequest) { return this.leadsService.create(data, req.user!); }
  @Patch(':id') update(@Param('id') id: string, @Body() data: UpdateLeadDto, @Req() req: AuthRequest) { return this.leadsService.update(id, data, req.user!); }
  @Patch(':id/assign') assign(@Param('id') id: string, @Body() data: AssignLeadDto, @Req() req: AuthRequest) { return this.leadsService.assign(id, data.assignedUserId ?? null, req.user!); }
  @Patch(':id/status') updateStatus(@Param('id') id: string, @Body() data: UpdateLeadStatusDto, @Req() req: AuthRequest) { return this.leadsService.updateStatus(id, data.status, req.user!); }
  @Patch(':id/temperature') updateTemperature(@Param('id') id: string, @Body() data: UpdateLeadTemperatureDto, @Req() req: AuthRequest) { return this.leadsService.updateTemperature(id, data.temperature, req.user!); }
  @Get(':id/activities') activities(@Param('id') id: string, @Query() query: ListLeadActivitiesDto, @Req() req: AuthRequest) { return this.leadsService.listActivities(id, query, req.user!); }
  @Post(':id/activities') createActivity(@Param('id') id: string, @Body() data: CreateLeadActivityDto, @Req() req: AuthRequest) { return this.leadsService.createActivity(id, data, req.user!); }
  @Patch(':id/activities/:activityId') updateActivity(@Param('id') id: string, @Param('activityId') activityId: string, @Body() data: UpdateLeadActivityDto, @Req() req: AuthRequest) { return this.leadsService.updateActivity(id, activityId, data, req.user!); }
  @UseGuards(RolesGuard) @Roles(Role.ADMIN)
  @Delete(':id') remove(@Param('id') id: string, @Req() req: AuthRequest) { return this.leadsService.remove(id, req.user!); }
}
