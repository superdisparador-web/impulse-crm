import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddRecipientsDto } from './dto/add-recipients.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { ListCampaignsDto } from './dto/list-campaigns.dto';
import { ScheduleCampaignDto } from './dto/schedule-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignsService } from './campaigns.service';

type AuthRequest = Request & { user?: { id?: string } };
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}
  private userId(req: AuthRequest) { return req.user?.id ?? ''; }
  @Get() findAll(@Req() req: AuthRequest, @Query() query: ListCampaignsDto) { return this.campaignsService.findAll(this.userId(req), query); }
  @Get(':id') findOne(@Req() req: AuthRequest, @Param('id') id: string) { return this.campaignsService.findOne(this.userId(req), id); }
  @Post() create(@Req() req: AuthRequest, @Body() data: CreateCampaignDto) { return this.campaignsService.create(this.userId(req), data); }
  @Patch(':id') update(@Req() req: AuthRequest, @Param('id') id: string, @Body() data: UpdateCampaignDto) { return this.campaignsService.update(this.userId(req), id, data); }
  @Delete(':id') remove(@Req() req: AuthRequest, @Param('id') id: string) { return this.campaignsService.remove(this.userId(req), id); }
  @Post(':id/recipients') addRecipients(@Req() req: AuthRequest, @Param('id') id: string, @Body() data: AddRecipientsDto) { return this.campaignsService.addRecipients(this.userId(req), id, data); }
  @Delete(':id/recipients/:recipientId') removeRecipient(@Req() req: AuthRequest, @Param('id') id: string, @Param('recipientId') recipientId: string) { return this.campaignsService.removeRecipient(this.userId(req), id, recipientId); }
  @Post(':id/schedule') schedule(@Req() req: AuthRequest, @Param('id') id: string, @Body() data: ScheduleCampaignDto) { return this.campaignsService.schedule(this.userId(req), id, data); }
  @Post(':id/cancel') cancel(@Req() req: AuthRequest, @Param('id') id: string) { return this.campaignsService.cancel(this.userId(req), id); }
  @Post(':id/duplicate') duplicate(@Req() req: AuthRequest, @Param('id') id: string) { return this.campaignsService.duplicate(this.userId(req), id); }
}
