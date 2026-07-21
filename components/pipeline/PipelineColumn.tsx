import PipelineCard from './PipelineCard';
import { Lead } from '@/types/lead';
import { PipelineStage } from '@/types/pipeline';

interface PipelineColumnProps { stage: PipelineStage; leads: Lead[]; activeDropStageId: string | null; draggingLeadId: string | null; onOpenLead: (lead: Lead) => void; onCardPointerDown: (event: React.PointerEvent<HTMLElement>, lead: Lead) => void; }

export default function PipelineColumn({ stage, leads, activeDropStageId, draggingLeadId, onOpenLead, onCardPointerDown }: PipelineColumnProps) {
  const isActiveDrop = activeDropStageId === stage.id;
  return (
    <section data-stage-id={stage.id} className={`flex max-h-[calc(100vh-260px)] min-h-[560px] w-80 shrink-0 flex-col rounded-3xl border bg-slate-950/90 p-4 transition ${isActiveDrop ? 'border-blue-400 ring-2 ring-blue-500/40' : 'border-slate-800'}`}>
      <header className="mb-4 flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: stage.color }} /><h2 className="truncate font-semibold text-white">{stage.name}</h2></div><span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">{leads.length}</span></header>
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {leads.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">Solte leads aqui</div> : leads.map((lead) => <PipelineCard key={lead.id} lead={lead} isDragging={draggingLeadId === lead.id} onOpen={onOpenLead} onPointerDown={onCardPointerDown} />)}
      </div>
    </section>
  );
}
