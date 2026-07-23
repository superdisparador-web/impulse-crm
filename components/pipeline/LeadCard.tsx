import { PipelineCard } from "@/types/pipeline-board";
import { formatStageTime } from "./pipeline-utils";

export function LeadCard({ card, dragging, onOpen }: { card: PipelineCard; dragging: boolean; onOpen?: (card: PipelineCard) => void }) {
  const lead = card.lead;
  const stageTime = formatStageTime(card.enteredStageAt);
  const badge = lead.temperature || lead.status;
  return <article draggable tabIndex={0} onClick={() => onOpen?.(card)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onOpen?.(card); }} aria-label={`Lead ${lead.name || lead.phone || lead.email || "sem nome"}`} data-card-id={card.id} className={`cursor-grab rounded-xl border bg-slate-950 p-4 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40 ${dragging ? "border-blue-400 opacity-60" : "border-slate-700 hover:border-blue-500"}`}><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-white">{lead.name || "Lead sem nome"}</h3>{badge && <span className="rounded-full bg-blue-950 px-2 py-1 text-xs text-blue-200">{badge}</span>}</div><div className="mt-3 space-y-1 text-sm text-slate-400">{lead.phone && <p>{lead.phone}</p>}{lead.email && <p>{lead.email}</p>}{lead.assignedUser?.name && <p>Corretor: {lead.assignedUser.name}</p>}{stageTime && <p>{stageTime}</p>}</div></article>;
}
