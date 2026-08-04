import { LeadEvent } from "@/types/lead";
import { formatDateTime } from "./lead360-utils";

export default function LegacyLeadHistory({ history = [] }: { history?: LeadEvent[] }) {
  return <div className="space-y-3">{history.length === 0 ? <p className="text-sm text-slate-400">Sem eventos.</p> : history.map((item) => <div key={item.id} className="rounded-lg border border-slate-800 p-3"><p className="font-medium">{item.description}</p><p className="text-xs text-slate-400">{item.eventType} • {new Date(item.occurredAt).toLocaleString("pt-BR")}{item.actorUser ? ` • ${item.actorUser.name}` : ""}</p></div>)}</div>;
}

export function LeadHistory({ stages }: { stages: { id: string; name: string; date?: string | null; current: boolean }[] }) {
  return <section className="space-y-3"><h3 className="text-lg font-semibold text-white">Histórico do Pipeline</h3><ol className="space-y-2">{stages.map((stage, index) => <li key={stage.id} className="flex items-center gap-3"><div className={`h-3 w-3 rounded-full ${stage.current ? "bg-blue-400" : "bg-slate-600"}`} /><div><p className={stage.current ? "font-semibold text-white" : "text-slate-300"}>{stage.name}</p>{stage.date && <time className="text-xs text-slate-500">{formatDateTime(stage.date)}</time>}{index < stages.length - 1 && <p className="text-slate-600">↓</p>}</div></li>)}</ol></section>;
}
