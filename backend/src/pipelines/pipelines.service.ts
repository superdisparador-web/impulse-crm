import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePipelineStageDto } from './dto/create-pipeline-stage.dto';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { ListPipelineStagesDto } from './dto/list-pipeline-stages.dto';
import { ListPipelinesDto } from './dto/list-pipelines.dto';
import { UpdatePipelineStageDto } from './dto/update-pipeline-stage.dto';
import { UpdatePipelineDto } from './dto/update-pipeline.dto';

const pipelineSelect = {
  id: true,
  name: true,
  active: true,
  stages: { where: { deletedAt: null }, orderBy: { order: 'asc' as const }, select: { id: true, name: true, order: true, color: true, active: true, pipelineId: true } },
} satisfies Prisma.PipelineSelect;

const stageSelect = { id: true, name: true, order: true, color: true, active: true, pipelineId: true } satisfies Prisma.PipelineStageSelect;

@Injectable()
export class PipelinesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, query: ListPipelinesDto) {
    return this.prisma.pipeline.findMany({
      where: { organizationId, deletedAt: null, ...(query.active !== undefined ? { active: query.active } : {}) },
      select: pipelineSelect,
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(organizationId: string, data: CreatePipelineDto) {
    return this.prisma.pipeline.create({
      data: { name: data.name.trim(), organizationId, active: data.active ?? true },
      select: pipelineSelect,
    });
  }

  async update(organizationId: string, id: string, data: UpdatePipelineDto) {
    await this.ensurePipeline(organizationId, id);
    return this.prisma.pipeline.update({ where: { id }, data: { name: data.name?.trim(), active: data.active }, select: pipelineSelect });
  }

  async remove(organizationId: string, id: string) {
    await this.ensurePipeline(organizationId, id);
    await this.prisma.pipeline.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
    return { success: true };
  }

  async findStages(organizationId: string, query: ListPipelineStagesDto) {
    if (query.pipelineId) await this.ensurePipeline(organizationId, query.pipelineId);
    return this.prisma.pipelineStage.findMany({
      where: { deletedAt: null, pipeline: { organizationId, deletedAt: null }, ...(query.pipelineId ? { pipelineId: query.pipelineId } : {}), ...(query.active !== undefined ? { active: query.active } : {}) },
      select: stageSelect,
      orderBy: [{ pipelineId: 'asc' }, { order: 'asc' }],
    });
  }

  async createStage(organizationId: string, data: CreatePipelineStageDto) {
    await this.ensurePipeline(organizationId, data.pipelineId);
    const order = data.order ?? await this.nextStageOrder(data.pipelineId);
    return this.prisma.pipelineStage.create({ data: { name: data.name.trim(), pipelineId: data.pipelineId, order, color: data.color ?? '#2563eb', active: data.active ?? true }, select: stageSelect });
  }

  async updateStage(organizationId: string, id: string, data: UpdatePipelineStageDto) {
    const current = await this.ensureStage(organizationId, id);
    if (data.pipelineId) await this.ensurePipeline(organizationId, data.pipelineId);
    return this.prisma.pipelineStage.update({ where: { id }, data: { name: data.name?.trim(), pipelineId: data.pipelineId ?? current.pipelineId, order: data.order, color: data.color, active: data.active }, select: stageSelect });
  }

  async removeStage(organizationId: string, id: string) {
    await this.ensureStage(organizationId, id);
    const leads = await this.prisma.lead.count({ where: { organizationId, stageId: id, deletedAt: null } });
    if (leads > 0) throw new BadRequestException('Não é possível excluir etapa com leads ativos');
    await this.prisma.pipelineStage.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
    return { success: true };
  }

  private async ensurePipeline(organizationId: string, id: string) {
    const pipeline = await this.prisma.pipeline.findFirst({ where: { id, organizationId, deletedAt: null }, select: { id: true } });
    if (!pipeline) throw new NotFoundException('Pipeline não encontrado');
    return pipeline;
  }

  private async ensureStage(organizationId: string, id: string) {
    const stage = await this.prisma.pipelineStage.findFirst({ where: { id, deletedAt: null, pipeline: { organizationId, deletedAt: null } }, select: { id: true, pipelineId: true } });
    if (!stage) throw new NotFoundException('Etapa não encontrada');
    return stage;
  }

  private async nextStageOrder(pipelineId: string) {
    const last = await this.prisma.pipelineStage.findFirst({ where: { pipelineId, deletedAt: null }, orderBy: { order: 'desc' }, select: { order: true } });
    return (last?.order ?? -1) + 1;
  }
}
