interface PipelineHeaderProps { totalLeads: number; totalStages: number; }

export default function PipelineHeader({ totalLeads, totalStages }: PipelineHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-300">Pipeline</span>
        <h1 className="mt-3 text-4xl font-bold text-white">Kanban comercial</h1>
        <p className="mt-2 text-slate-400">Acompanhe oportunidades, responsáveis e temperatura em cada etapa de vendas.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3"><p className="text-2xl font-bold text-white">{totalLeads}</p><p className="text-xs text-slate-400">leads</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3"><p className="text-2xl font-bold text-white">{totalStages}</p><p className="text-xs text-slate-400">etapas</p></div>
      </div>
    </div>
  );
}
