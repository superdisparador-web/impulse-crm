"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CheckCheck,
  Eye,
  Megaphone,
  MousePointerClick,
  ShoppingBag,
} from "lucide-react";
import KpiCard from "@/components/dashboard/KpiCard";
import { analyticsService } from "@/services/analytics.service";
import { ExecutiveAnalytics } from "@/types/analytics";
import { AnalyticsCard } from "@/components/analytics/AnalyticsUi";
import {
  DonutChart,
  MiniLineChart,
  SimpleHeatmap,
} from "@/components/analytics/AnalyticsCharts";

const number = new Intl.NumberFormat("pt-BR");
const percent = (value: number) =>
  `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

export default function AnalyticsPage() {
  const [data, setData] = useState<ExecutiveAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    analyticsService
      .executive()
      .then(setData)
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar os indicadores.",
        ),
      );
  }, []);
  if (error)
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    );
  if (!data)
    return (
      <div
        className="animate-pulse rounded-3xl bg-slate-100 p-10 text-slate-500"
        aria-busy="true"
      >
        Carregando inteligência comercial...
      </div>
    );
  const cards = [
    ["Campanhas ativas", data.campaigns.active, <Megaphone key="a" />],
    ["Mensagens enviadas", data.messages.sent, <BarChart3 key="b" />],
    ["Entregues", data.messages.delivered, <CheckCheck key="c" />],
    ["Lidas", data.messages.read, <Eye key="d" />],
    ["Cliques", data.messages.clicked, <MousePointerClick key="e" />],
    ["Vendas", data.conversions, <ShoppingBag key="f" />],
  ] as const;
  return (
    <div className="space-y-7">
      <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-7 text-white shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[.24em] text-blue-200">
          Inteligência comercial
        </p>
        <h1 className="mt-2 text-3xl font-bold">Analytics executivo</h1>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Object.entries(data.rates).map(([key, value]) => (
            <div
              key={key}
              className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"
            >
              <p className="text-xs uppercase text-blue-100">
                {
                  {
                    ctr: "CTR",
                    readRate: "Read rate",
                    deliveryRate: "Delivery rate",
                    conversionRate: "Conversão",
                  }[key]
                }
              </p>
              <strong className="mt-1 block text-2xl">{percent(value)}</strong>
            </div>
          ))}
        </div>
      </header>
      <nav
        aria-label="Dashboards de inteligência"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
      >
        {[
          ["Corretores", "/analytics/brokers"],
          ["Gerentes", "/analytics/managers"],
          ["Templates", "/analytics/templates"],
          ["Eventos", "/analytics/events"],
          ["Relatórios", "/reports"],
        ].map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700"
          >
            {label}
          </Link>
        ))}
      </nav>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value, icon]) => (
          <KpiCard key={label} label={label} value={value} icon={icon} />
        ))}
      </section>
      <section className="grid gap-5 lg:grid-cols-3">
        <AnalyticsCard title="Evolução de envios">
          <MiniLineChart
            points={data.temporal.map((item) => item.whatsappSent)}
            label="Gráfico de linha e área de mensagens enviadas"
          />
        </AnalyticsCard>
        <AnalyticsCard title="Entrega, leitura e falhas">
          <DonutChart
            values={[
              data.messages.delivered,
              data.messages.read,
              data.messages.failed,
            ]}
            label="Gráfico de pizza de mensagens"
          />
        </AnalyticsCard>
        <AnalyticsCard title="Intensidade por período">
          <SimpleHeatmap
            values={data.temporal.map(
              (item) => item.whatsappSent + item.whatsappRead,
            )}
            label="Mapa de calor simples de atividade"
          />
        </AnalyticsCard>
      </section>
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-bold text-slate-900">
            Ranking de campanhas
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="pb-3">Campanha</th>
                  <th>Enviadas</th>
                  <th>CTR</th>
                  <th>Leitura</th>
                  <th>Entrega</th>
                </tr>
              </thead>
              <tbody>
                {data.ranking.map((item, index) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="py-4 font-semibold text-slate-800">
                      <span className="mr-3 text-blue-600">#{index + 1}</span>
                      {item.name}
                    </td>
                    <td>{number.format(item.sent)}</td>
                    <td>{percent(item.ctr)}</td>
                    <td>{percent(item.readRate)}</td>
                    <td>{percent(item.deliveryRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle size={20} />
            <h2 className="font-bold">Alertas operacionais</h2>
          </div>
          <div className="mt-4 space-y-3">
            {data.operationalAlerts.length ? (
              data.operationalAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-xl bg-white p-3 text-sm shadow-sm"
                >
                  <strong>{alert.status}</strong>
                  <p className="mt-1 text-slate-500">
                    {alert.lastError || "Fila requer acompanhamento"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-amber-700">
                Nenhum alerta no período.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
