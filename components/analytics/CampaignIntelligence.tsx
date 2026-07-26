"use client";
import { useEffect, useState } from "react";
import { Clock3, MousePointerClick, TrendingDown } from "lucide-react";
import { analyticsService } from "@/services/analytics.service";
import { CampaignFunnel } from "@/types/analytics";
import { AnalyticsCard, EmptyState, ErrorState, LoadingState, RateBadge } from "./AnalyticsUi";
import { FunnelChart } from "./AnalyticsCharts";

const duration = (milliseconds: number) => milliseconds ? `${Math.round(milliseconds / 60000)} min` : "—";
export function CampaignIntelligence({ campaignId, sent, delivered, read, clicked, contacts }: { campaignId: string; sent: number; delivered: number; read: number; clicked: number; contacts: number }) {
  const [data, setData] = useState<CampaignFunnel | null>(null); const [error, setError] = useState("");
  useEffect(() => { let active = true; analyticsService.campaignFunnel(campaignId).then((value) => active && setData(value)).catch((reason: unknown) => active && setError(reason instanceof Error ? reason.message : "Erro ao carregar funil.")); return () => { active = false; }; }, [campaignId]);
  if (error) return <ErrorState message={error}/>; if (!data) return <LoadingState label="Calculando funil comercial..."/>;
  const rates = [{ label: "CTR", value: delivered ? clicked / delivered * 100 : 0 }, { label: "Delivery rate", value: sent ? delivered / sent * 100 : 0 }, { label: "Read rate", value: delivered ? read / delivered * 100 : 0 }, { label: "Conversão", value: contacts ? (data.stages.at(-1)?.value ?? 0) / contacts * 100 : 0 }];
  return <section className="space-y-5" aria-label="Inteligência da campanha"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{rates.map((item) => <AnalyticsCard key={item.label}><p className="text-sm font-semibold text-slate-500">{item.label}</p><p className="mt-2 text-3xl font-bold text-slate-950">{item.value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%</p></AnalyticsCard>)}</div><div className="grid gap-5 xl:grid-cols-[2fr_1fr]"><AnalyticsCard title="Funil da campanha">{data.stages.length ? <FunnelChart stages={data.stages} bottleneck={data.bottleneck}/> : <EmptyState message="O funil ainda não possui eventos."/>}</AnalyticsCard><div className="space-y-4"><AnalyticsCard><Clock3 className="text-blue-600"/><p className="mt-3 text-sm text-slate-500">Tempo médio até entrega</p><strong className="text-2xl text-slate-900">{duration(data.averageDeliveryTimeMs)}</strong><p className="mt-3 text-sm text-slate-500">Tempo médio até leitura</p><strong className="text-xl text-slate-900">{duration(data.averageReadTimeMs)}</strong></AnalyticsCard><AnalyticsCard><TrendingDown className="text-amber-600"/><p className="mt-3 text-sm text-slate-500">Gargalo identificado</p><strong className="text-xl text-slate-900">{data.bottleneck?.label ?? "Sem gargalo"}</strong><div className="mt-2">{data.bottleneck && <RateBadge value={data.bottleneck.stepRate}/>}</div><p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><MousePointerClick size={14}/> Atualizado pela jornada real dos destinatários.</p></AnalyticsCard></div></div></section>;
}

