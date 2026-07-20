import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { ListLeadsDto } from './dto/list-leads.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { UpdateLeadTemperatureDto } from './dto/update-lead-temperature.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsService } from './leads.service';

type AuthRequest = Request & { user?: { id?: string } };

@UseGuards(AuthGuard('jwt'))
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}
  @Get() findAll(@Query() query: ListLeadsDto) { return this.leadsService.findAll(query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.leadsService.findOne(id); }
  @Post() create(@Body() data: CreateLeadDto, @Req() req: AuthRequest) { return this.leadsService.create(data, req.user?.id); }
  @Patch(':id') update(@Param('id') id: string, @Body() data: UpdateLeadDto, @Req() req: AuthRequest) { return this.leadsService.update(id, data, req.user?.id); }
  @Patch(':id/assign') assign(@Param('id') id: string, @Body() data: AssignLeadDto, @Req() req: AuthRequest) { return this.leadsService.assign(id, data.assignedUserId ?? null, req.user?.id); }
  @Patch(':id/status') updateStatus(@Param('id') id: string, @Body() data: UpdateLeadStatusDto, @Req() req: AuthRequest) { return this.leadsService.updateStatus(id, data.status, req.user?.id); }
  @Patch(':id/temperature') updateTemperature(@Param('id') id: string, @Body() data: UpdateLeadTemperatureDto, @Req() req: AuthRequest) { return this.leadsService.updateTemperature(id, data.temperature, req.user?.id); }
  @Delete(':id') remove(@Param('id') id: string, @Req() req: AuthRequest) { return this.leadsService.remove(id, req.user?.id); }
}
