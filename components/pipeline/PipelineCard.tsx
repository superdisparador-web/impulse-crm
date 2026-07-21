import { Phone, UserCircle2 } from 'lucide-react';
import { Lead } from '@/types/lead';

const temperatureStyle = { COLD: 'bg-sky-500/10 text-sky-300 border-sky-500/30', WARM: 'bg-amber-500/10 text-amber-300 border-amber-500/30', HOT: 'bg-red-500/10 text-red-300 border-red-500/30' } satisfies Record<Lead['temperature'], string>;
const temperatureLabel = { COLD: 'Frio', WARM: 'Morno', HOT: 'Quente' } satisfies Record<Lead['temperature'], string>;

interface PipelineCardProps { lead: Lead; isDragging?: boolean; onOpen: (lead: Lead) => void; onPointerDown: (event: React.PointerEvent<HTMLElement>, lead: Lead) => void; }

export default function PipelineCard({ lead, isDragging, onOpen, onPointerDown }: PipelineCardProps) {
  return (
    <article role="button" tabIndex={0} aria-label={`Abrir lead ${lead.name}`} onClick={() => onOpen(lead)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onOpen(lead); }} onPointerDown={(event) => onPointerDown(event, lead)} className={`touch-none rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:border-blue-500/70 ${isDragging ? 'opacity-50 ring-2 ring-blue-500' : ''}`}>
      <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold leading-tight text-white">{lead.name}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400"><Phone size={14} />{lead.phone}</p></div><span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${temperatureStyle[lead.temperature]}`}>{temperatureLabel[lead.temperature]}</span></div>
      <div className="mt-4 space-y-2 text-sm text-slate-300"><p className="flex items-center gap-2"><UserCircle2 size={16} className="text-slate-500" />{lead.assignedUser?.name ?? 'Sem responsável'}</p><div className="flex flex-wrap gap-2"><span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">{lead.status}</span><span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">{lead.source}</span></div></div>
    </article>
  );
}
