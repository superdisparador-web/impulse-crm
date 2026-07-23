import Button from "@/components/ui/Button";
import { PipelineCard } from "@/types/pipeline-board";
import { translateStatus, translateTemperature } from "./lead360-utils";

export function LeadHeader({ card, archiving, onArchive, onClose }: { card: PipelineCard; archiving: boolean; onArchive: () => void; onClose: () => void }) {
  const lead = card.lead;
  return <header className="border-b border-slate-800 p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-bold text-white">{lead.name || lead.phone || lead.email || "Lead sem nome"}</h2><div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-orange-950 px-3 py-1 text-orange-200">{translateTemperature(lead.temperature)}</span><span className="rounded-full bg-blue-950 px-3 py-1 text-blue-200">{translateStatus(lead.status)}</span>{lead.assignedUser?.name && <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-200">Corretor: {lead.assignedUser.name}</span>}</div></div><button aria-label="Fechar ficha do lead" onClick={onClose} className="rounded-full border border-slate-700 px-3 py-1 text-slate-300 hover:bg-slate-800">×</button></div><div className="mt-4 flex flex-wrap gap-2"><Button variant="danger" disabled={archiving} onClick={onArchive} className="px-3 py-2 text-sm">Arquivar</Button><Button variant="secondary" onClick={onClose} className="px-3 py-2 text-sm">Fechar</Button></div></header>;
}
