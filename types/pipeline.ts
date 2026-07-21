import { Lead } from './lead';

export interface PipelineStage { id: string; name: string; order: number; color: string; active: boolean; pipelineId: string; leads?: Lead[]; }
export interface Pipeline { id: string; name: string; active: boolean; stages: PipelineStage[]; }
export interface PipelineListParams { active?: boolean | ''; }
export interface PipelineStageListParams { pipelineId?: string; active?: boolean | ''; }
