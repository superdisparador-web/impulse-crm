import { PipelineMetrics as Metrics } from "@/types/pipeline-board";

export function PipelineMetrics({ metrics }: { metrics?: Metrics }) {
  const cards = [{ label: "Total de leads", value: metrics?.total ?? 0 }, { label: "Conversão", value: `${metrics?.conversionRate ?? 0}%` }, { label: "Tempo médio", value: `${metrics?.averageStageHours ?? 0}h` }, { label: "SLA vencido", value: metrics?.overdueSla ?? 0 }];
  return <section aria-label="Métricas do pipeline" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <article key={card.label} className="rounded-2xl border border-blue-900/50 bg-gradient-to-br from-slate-900 to-blue-950/50 p-4"><p className="text-sm text-slate-400">{card.label}</p><strong className="mt-2 block text-2xl text-white">{card.value}</strong></article>)}</section>;
}
