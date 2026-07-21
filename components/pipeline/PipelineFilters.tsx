import { Pipeline } from '@/types/pipeline';

interface PipelineFiltersProps { pipelines: Pipeline[]; pipelineId: string; search: string; onPipelineChange: (pipelineId: string) => void; onSearchChange: (search: string) => void; }

export default function PipelineFilters({ pipelines, pipelineId, search, onPipelineChange, onSearchChange }: PipelineFiltersProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 md:grid-cols-[minmax(220px,320px)_1fr]">
      {pipelines.length > 1 ? (
        <label className="space-y-2"><span className="text-sm font-medium text-slate-300">Pipeline</span><select className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-blue-500" value={pipelineId} onChange={(e) => onPipelineChange(e.target.value)}>{pipelines.map((pipeline) => <option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option>)}</select></label>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Pipeline ativo</p><p className="font-semibold text-white">{pipelines[0]?.name ?? 'Nenhum pipeline'}</p></div>
      )}
      <label className="space-y-2"><span className="text-sm font-medium text-slate-300">Busca</span><input className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-blue-500" placeholder="Buscar por nome, telefone ou e-mail..." value={search} onChange={(e) => onSearchChange(e.target.value)} /></label>
    </div>
  );
}
