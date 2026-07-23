import { Lead360TimelineItem } from "@/types/lead-360";
import { formatDateTime } from "./lead360-utils";

export function LeadTimeline({ items }: { items: Lead360TimelineItem[] }) {
  return <section className="space-y-3"><h3 className="text-lg font-semibold text-white">Timeline</h3><ol className="space-y-3">{items.map((item) => <li key={item.id} className="relative border-l border-slate-700 pl-4"><span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-blue-500" /><p className="font-medium text-slate-100">{item.title}</p>{item.description && <p className="text-sm text-slate-400">{item.description}</p>}<time className="text-xs text-slate-500">{formatDateTime(item.occurredAt)}</time></li>)}</ol></section>;
}
