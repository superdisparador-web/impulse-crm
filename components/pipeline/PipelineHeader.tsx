import { RefreshCw } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { PipelineSummary } from "@/types/pipeline-board";

export function PipelineHeader({ pipelines, selectedPipelineId, loading, refreshing, onSelectPipeline, onRefresh }: { pipelines: PipelineSummary[]; selectedPipelineId: string; loading: boolean; refreshing: boolean; onSelectPipeline: (pipelineId: string) => void; onRefresh: () => void }) {
  return <PageHeader title="Funil de vendas" description="Acompanhe e movimente seus leads pelo funil de vendas." action={<div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end md:w-auto"><Select label="Selecionar funil" aria-label="Selecionar funil" className="sm:min-w-64" disabled={loading || pipelines.length === 0} value={selectedPipelineId} onChange={(event) => onSelectPipeline(event.target.value)} options={[{ value: "", label: "Selecione" }, ...pipelines.map((pipeline) => ({ value: pipeline.id, label: `${pipeline.name}${pipeline.isDefault ? " • padrão" : ""}` }))]} /><Button className="sm:mb-px" onClick={onRefresh} disabled={loading || refreshing || !selectedPipelineId} loading={refreshing}><RefreshCw size={18} />{refreshing ? "Atualizando" : "Atualizar"}</Button></div>} />;
}
