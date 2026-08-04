import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ArchiveCampaignDto } from './dto/archive-campaign.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { EstimateCampaignDto } from './dto/estimate-campaign.dto';
import { ListCampaignsDto } from './dto/list-campaigns.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignsService } from './campaigns.service';

type AuthRequest = Request & { user?: { id?: string } };
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}
  private userId(req: AuthRequest) { return req.user?.id ?? ''; }
  @Get() @Permissions('campaigns:read') findAll(@Req() req: AuthRequest, @Query() query: ListCampaignsDto) { return this.campaignsService.findAll(this.userId(req), query); }
  @Post('estimate') @Permissions('campaigns:read') estimate(@Req() req: AuthRequest, @Body() data: EstimateCampaignDto) { return this.campaignsService.estimate(this.userId(req), data.filters); }
  @Get(':id') @Permissions('campaigns:read') findOne(@Req() req: AuthRequest, @Param('id') id: string) { return this.campaignsService.findOne(this.userId(req), id); }
  @Post() @Permissions('campaigns:create') create(@Req() req: AuthRequest, @Body() data: CreateCampaignDto) { return this.campaignsService.create(this.userId(req), data); }
  @Patch(':id') @Permissions('campaigns:update') update(@Req() req: AuthRequest, @Param('id') id: string, @Body() data: UpdateCampaignDto) { return this.campaignsService.update(this.userId(req), id, data); }
  @Patch(':id/archive') @Permissions('campaigns:archive') archive(@Req() req: AuthRequest, @Param('id') id: string, @Body() data: ArchiveCampaignDto) { return this.campaignsService.archive(this.userId(req), id, data.archived); }
  @Patch(':id/restore') @Permissions('campaigns:archive') restore(@Req() req: AuthRequest, @Param('id') id: string) { return this.campaignsService.restore(this.userId(req), id); }
  @Post(':id/cancel') @Permissions('campaigns:cancel') cancel(@Req() req: AuthRequest, @Param('id') id: string) { return this.campaignsService.cancel(this.userId(req), id); }
  @Delete(':id') @Permissions('campaigns:archive') remove(@Req() req: AuthRequest, @Param('id') id: string) { return this.campaignsService.remove(this.userId(req), id); }
}
