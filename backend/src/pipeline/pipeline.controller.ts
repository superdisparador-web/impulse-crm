import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';
import { ActivityDto, AssignDto, ChangePipelineDto, ChecklistDto, DealDto, ListDto, LossReasonDto, MoveDto, PipelineDto, ReopenDto, ReorderStagesDto, StageDto, TagDealDto, TagDto, UpdateDealDto, WonDto, LostDto } from './dto/pipeline.dto';
import { PipelineService } from './pipeline.service';

type AuthRequest = Request & { user?: { id: string; role?: Role } };

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.CORRETOR)
@Controller('pipeline')
export class PipelineController {
  constructor(private readonly service: PipelineService) {}

  @Get('pipelines') listPipelines(@Query() q: ListDto, @Req() req: AuthRequest) { return this.service.listPipelines(q, req.user!); }
  @Post('pipelines') createPipeline(@Body() d: PipelineDto, @Req() req: AuthRequest) { return this.service.createPipeline(d, req.user!); }
  @Get('pipelines/:id') getPipeline(@Param('id') id: string, @Req() req: AuthRequest) { return this.service.getPipeline(id, req.user!); }
  @Patch('pipelines/:id') updatePipeline(@Param('id') id: string, @Body() d: PipelineDto, @Req() req: AuthRequest) { return this.service.updatePipeline(id, d, req.user!); }
  @Delete('pipelines/:id') archivePipeline(@Param('id') id: string, @Req() req: AuthRequest) { return this.service.archivePipeline(id, req.user!); }
  @Get('pipelines/:id/kanban') kanban(@Param('id') id: string, @Query() q: ListDto, @Req() req: AuthRequest) { return this.service.kanban(id, q, req.user!); }

  @Post('pipelines/:pipelineId/stages') createStage(@Param('pipelineId') pipelineId: string, @Body() d: StageDto, @Req() req: AuthRequest) { return this.service.createStage(pipelineId, d, req.user!); }
  @Patch('stages/reorder/:pipelineId') reorderStages(@Param('pipelineId') pipelineId: string, @Body() d: ReorderStagesDto, @Req() req: AuthRequest) { return this.service.reorderStages(pipelineId, d, req.user!); }
  @Patch('stages/:id') updateStage(@Param('id') id: string, @Body() d: StageDto, @Req() req: AuthRequest) { return this.service.updateStage(id, d, req.user!); }
  @Delete('stages/:id') archiveStage(@Param('id') id: string, @Req() req: AuthRequest) { return this.service.archiveStage(id, req.user!); }

  @Post('stages/:stageId/checklists') createChecklist(@Param('stageId') stageId: string, @Body() d: ChecklistDto, @Req() req: AuthRequest) { return this.service.createChecklist(stageId, d, req.user!); }
  @Patch('checklists/:id') updateChecklist(@Param('id') id: string, @Body() d: ChecklistDto, @Req() req: AuthRequest) { return this.service.updateChecklist(id, d, req.user!); }
  @Delete('checklists/:id') archiveChecklist(@Param('id') id: string, @Req() req: AuthRequest) { return this.service.archiveChecklist(id, req.user!); }

  @Get('loss-reasons') listLossReasons(@Query() q: ListDto, @Req() req: AuthRequest) { return this.service.listLossReasons(q, req.user!); }
  @Post('loss-reasons') createLossReason(@Body() d: LossReasonDto, @Req() req: AuthRequest) { return this.service.createLossReason(d, req.user!); }
  @Patch('loss-reasons/:id') updateLossReason(@Param('id') id: string, @Body() d: LossReasonDto, @Req() req: AuthRequest) { return this.service.updateLossReason(id, d, req.user!); }
  @Delete('loss-reasons/:id') archiveLossReason(@Param('id') id: string, @Req() req: AuthRequest) { return this.service.archiveLossReason(id, req.user!); }

  @Get('tags') listTags(@Query() q: ListDto, @Req() req: AuthRequest) { return this.service.listTags(q, req.user!); }
  @Post('tags') createTag(@Body() d: TagDto, @Req() req: AuthRequest) { return this.service.createTag(d, req.user!); }
  @Patch('tags/:id') updateTag(@Param('id') id: string, @Body() d: TagDto, @Req() req: AuthRequest) { return this.service.updateTag(id, d, req.user!); }
  @Delete('tags/:id') archiveTag(@Param('id') id: string, @Req() req: AuthRequest) { return this.service.archiveTag(id, req.user!); }

  @Get('deals') listDeals(@Query() q: ListDto, @Req() req: AuthRequest) { return this.service.listDeals(q, req.user!); }
  @Post('deals') createDeal(@Body() d: DealDto, @Req() req: AuthRequest) { return this.service.createDeal(d, req.user!); }
  @Get('deals/:id') getDeal(@Param('id') id: string, @Req() req: AuthRequest) { return this.service.getDeal(id, req.user!); }
  @Patch('deals/:id') updateDeal(@Param('id') id: string, @Body() d: UpdateDealDto, @Req() req: AuthRequest) { return this.service.updateDeal(id, d, req.user!); }
  @Delete('deals/:id') archiveDeal(@Param('id') id: string, @Req() req: AuthRequest) { return this.service.archiveDeal(id, req.user!); }
  @Post('deals/:id/move') move(@Param('id') id: string, @Body() d: MoveDto, @Req() req: AuthRequest) { return this.service.moveDeal(id, d, req.user!); }
  @Post('deals/:id/change-pipeline') changePipeline(@Param('id') id: string, @Body() d: ChangePipelineDto, @Req() req: AuthRequest) { return this.service.changePipeline(id, d, req.user!); }
  @Post('deals/:id/assign') assign(@Param('id') id: string, @Body() d: AssignDto, @Req() req: AuthRequest) { return this.service.assignDeal(id, d, req.user!); }
  @Post('deals/:id/tags') addTag(@Param('id') id: string, @Body() d: TagDealDto, @Req() req: AuthRequest) { return this.service.addTag(id, d.tagId, req.user!); }
  @Delete('deals/:id/tags/:tagId') removeTag(@Param('id') id: string, @Param('tagId') tagId: string, @Req() req: AuthRequest) { return this.service.removeTag(id, tagId, req.user!); }
  @Post('deals/:id/won') won(@Param('id') id: string, @Body() d: WonDto, @Req() req: AuthRequest) { return this.service.won(id, d.amount, d.wonAt, d.notes, req.user!); }
  @Post('deals/:id/lost') lost(@Param('id') id: string, @Body() d: LostDto, @Req() req: AuthRequest) { return this.service.lost(id, d.lossReasonId, d.lostAt, d.notes, req.user!); }
  @Post('deals/:id/reopen') reopen(@Param('id') id: string, @Body() d: ReopenDto, @Req() req: AuthRequest) { return this.service.reopen(id, d, req.user!); }
  @Get('deals/:id/movements') movements(@Param('id') id: string, @Req() req: AuthRequest) { return this.service.movements(id, req.user!); }
  @Get('deals/:id/timeline') timeline(@Param('id') id: string, @Req() req: AuthRequest) { return this.service.timeline(id, req.user!); }
  @Post('deals/:id/activities') createActivity(@Param('id') id: string, @Body() d: ActivityDto, @Req() req: AuthRequest) { return this.service.createActivity(id, d, req.user!); }
  @Patch('deals/:id/activities/:activityId') updateActivity(@Param('id') id: string, @Param('activityId') activityId: string, @Body() d: ActivityDto, @Req() req: AuthRequest) { return this.service.updateActivity(id, activityId, d, req.user!); }
  @Post('deals/:id/activities/:activityId/cancel') cancelActivity(@Param('id') id: string, @Param('activityId') activityId: string, @Req() req: AuthRequest) { return this.service.cancelActivity(id, activityId, req.user!); }
}
