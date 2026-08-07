"use client";
import { useEffect, useState } from "react";
import { analyticsService } from "@/services/analytics.service";
import { TemplateAnalytics } from "@/types/analytics";
import {
  AnalyticsCard,
  AnalyticsHeader,
  DateRange,
  EmptyState,
  ErrorState,
  LoadingState,
  RateBadge,
} from "@/components/analytics/AnalyticsUi";
import { ComparisonBars } from "@/components/analytics/AnalyticsCharts";
export default function TemplateAnalyticsPage() {
  const [items, setItems] = useState<TemplateAnalytics[]>([]),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      void analyticsService
        .templates({ from: from || undefined, to: to || undefined })
        .then((value) => active && setItems(value))
        .catch(
          (reason: unknown) =>
            active &&
            setError(
              reason instanceof Error
                ? reason.message
                : "Erro ao carregar templates.",
            ),
        )
        .finally(() => active && setLoading(false));
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [from, to]);
  return (
    <main className="space-y-6">
      <AnalyticsHeader
        eyebrow="Conteúdo e conversão"
        title="Analytics dos Templates"
        description="Compare entrega, leitura, cliques e conversão dos templates utilizados em campanhas."
      />
      <AnalyticsCard>
        <DateRange
          from={from}
          to={to}
          onChange={(field, value) =>
            field === "from" ? setFrom(value) : setTo(value)
          }
        />
      </AnalyticsCard>
      {error && <ErrorState message={error} />}{" "}
      {loading ? (
        <LoadingState />
      ) : (
        <>
          <AnalyticsCard title="Comparativo de conversão">
            {items.length ? (
              <ComparisonBars
                items={items
                  .slice(0, 10)
                  .map((item) => ({
                    label: item.name,
                    value: item.conversionRate,
                  }))}
              />
            ) : (
              <EmptyState message="Nenhum template utilizado no período." />
            )}
          </AnalyticsCard>
          <AnalyticsCard title="Ranking de templates">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase text-slate-400">
                  <tr>
                    <th className="pb-3">Ranking</th>
                    <th>Template</th>
                    <th>Campanhas</th>
                    <th>Utilizações</th>
                    <th>CTR</th>
                    <th>Leitura</th>
                    <th>Entrega</th>
                    <th>Conversão</th>
                    <th>Última utilização</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-4 font-bold text-blue-600">
                        #{index + 1}
                      </td>
                      <td className="font-semibold text-slate-900">
                        {item.name}
                      </td>
                      <td>{item.campaigns}</td>
                      <td>{item.used}</td>
                      <td>
                        <RateBadge value={item.ctr} />
                      </td>
                      <td>
                        <RateBadge value={item.readRate} />
                      </td>
                      <td>
                        <RateBadge value={item.deliveryRate} />
                      </td>
                      <td>
                        <RateBadge value={item.conversionRate} />
                      </td>
                      <td>
                        {new Date(item.lastUsedAt).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AnalyticsCard>
        </>
      )}
    </main>
  );
}
