import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { RolesGuard } from '../auth/roles/roles.guard';
import { AddCardDto, CreatePipelineDto, CreateStageDto, ListPipelinesDto, MoveCardDto, ReorderStagesDto, UpdatePipelineDto, UpdateStageDto } from './dto/pipeline.dto';
import { PipelineService } from './pipeline.service';

type AuthRequest = Request & { user?: { id: string; role?: Role } };

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.CORRETOR)
@Controller('pipeline')
export class PipelineController {
  constructor(private readonly service: PipelineService) {}

  @Post() createPipeline(@Body() data: CreatePipelineDto, @Req() req: AuthRequest) { return this.service.createPipeline(data, req.user!); }
  @Get() listPipelines(@Query() query: ListPipelinesDto, @Req() req: AuthRequest) { return this.service.listPipelines(query, req.user!); }
  @Get(':pipelineId/board') board(@Param('pipelineId') pipelineId: string, @Req() req: AuthRequest) { return this.service.board(pipelineId, req.user!); }
  @Get(':pipelineId/stages') listStages(@Param('pipelineId') pipelineId: string, @Req() req: AuthRequest) { return this.service.listStages(pipelineId, req.user!); }
  @Post(':pipelineId/stages') createStage(@Param('pipelineId') pipelineId: string, @Body() data: CreateStageDto, @Req() req: AuthRequest) { return this.service.createStage(pipelineId, data, req.user!); }
  @Patch(':pipelineId/stages/reorder') reorderStages(@Param('pipelineId') pipelineId: string, @Body() data: ReorderStagesDto, @Req() req: AuthRequest) { return this.service.reorderStages(pipelineId, data, req.user!); }
  @Patch(':pipelineId/stages/:stageId') updateStage(@Param('pipelineId') pipelineId: string, @Param('stageId') stageId: string, @Body() data: UpdateStageDto, @Req() req: AuthRequest) { return this.service.updateStage(pipelineId, stageId, data, req.user!); }
  @Delete(':pipelineId/stages/:stageId') deleteStage(@Param('pipelineId') pipelineId: string, @Param('stageId') stageId: string, @Req() req: AuthRequest) { return this.service.deleteStage(pipelineId, stageId, req.user!); }
  @Post(':pipelineId/cards') addCard(@Param('pipelineId') pipelineId: string, @Body() data: AddCardDto, @Req() req: AuthRequest) { return this.service.addCard(pipelineId, data, req.user!); }
  @Get(':pipelineId/cards') listCards(@Param('pipelineId') pipelineId: string, @Req() req: AuthRequest) { return this.service.listCards(pipelineId, req.user!); }
  @Patch('cards/:cardId/move') moveCard(@Param('cardId') cardId: string, @Body() data: MoveCardDto, @Req() req: AuthRequest) { return this.service.moveCard(cardId, data, req.user!); }
  @Delete('cards/:cardId') removeCard(@Param('cardId') cardId: string, @Req() req: AuthRequest) { return this.service.removeCard(cardId, req.user!); }
  @Get(':id') getPipeline(@Param('id') id: string, @Req() req: AuthRequest) { return this.service.getPipeline(id, req.user!); }
  @Patch(':id') updatePipeline(@Param('id') id: string, @Body() data: UpdatePipelineDto, @Req() req: AuthRequest) { return this.service.updatePipeline(id, data, req.user!); }
  @Delete(':id') deletePipeline(@Param('id') id: string, @Req() req: AuthRequest) { return this.service.deletePipeline(id, req.user!); }
}
