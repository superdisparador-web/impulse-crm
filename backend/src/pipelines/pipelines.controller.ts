import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from '../auth/auth-user';
import { CreatePipelineStageDto } from './dto/create-pipeline-stage.dto';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { ListPipelineStagesDto } from './dto/list-pipeline-stages.dto';
import { ListPipelinesDto } from './dto/list-pipelines.dto';
import { UpdatePipelineStageDto } from './dto/update-pipeline-stage.dto';
import { UpdatePipelineDto } from './dto/update-pipeline.dto';
import { PipelinesService } from './pipelines.service';

@UseGuards(AuthGuard('jwt'))
@Controller()
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Get('pipelines')
  findAll(@Query() query: ListPipelinesDto, @Req() req: AuthRequest) { return this.pipelinesService.findAll(this.getOrganizationId(req), query); }

  @Post('pipelines')
  create(@Body() data: CreatePipelineDto, @Req() req: AuthRequest) { return this.pipelinesService.create(this.getOrganizationId(req), data); }

  @Patch('pipelines/:id')
  update(@Param('id') id: string, @Body() data: UpdatePipelineDto, @Req() req: AuthRequest) { return this.pipelinesService.update(this.getOrganizationId(req), id, data); }

  @Delete('pipelines/:id')
  remove(@Param('id') id: string, @Req() req: AuthRequest) { return this.pipelinesService.remove(this.getOrganizationId(req), id); }

  @Get('pipeline-stages')
  findStages(@Query() query: ListPipelineStagesDto, @Req() req: AuthRequest) { return this.pipelinesService.findStages(this.getOrganizationId(req), query); }

  @Post('pipeline-stages')
  createStage(@Body() data: CreatePipelineStageDto, @Req() req: AuthRequest) { return this.pipelinesService.createStage(this.getOrganizationId(req), data); }

  @Patch('pipeline-stages/:id')
  updateStage(@Param('id') id: string, @Body() data: UpdatePipelineStageDto, @Req() req: AuthRequest) { return this.pipelinesService.updateStage(this.getOrganizationId(req), id, data); }

  @Delete('pipeline-stages/:id')
  removeStage(@Param('id') id: string, @Req() req: AuthRequest) { return this.pipelinesService.removeStage(this.getOrganizationId(req), id); }

  private getOrganizationId(req: AuthRequest) {
    if (!req.user?.organizationId) throw new ForbiddenException('Usuário autenticado não possui organização vinculada');
    return req.user.organizationId;
  }
}
