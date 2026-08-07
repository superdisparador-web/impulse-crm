"use client";

import { memo } from "react";
import { CircleEllipsis, Info, RefreshCw, Users } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: typeof Users;
  hint: string;
  loading: boolean;
}

export const BrokerMetricCard = memo(function BrokerMetricCard({
  label,
  value,
  icon: Icon,
  hint,
  loading,
}: MetricCardProps) {
  const unavailable = value === "—";

  return (
    <article
      aria-label={`${label}: ${unavailable ? "dados ainda não integrados" : value}`}
      className="broker-metric-card group relative min-h-36 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
    >
      {loading ? (
        <div
          className="animate-pulse space-y-3"
          aria-label={`Carregando ${label}`}
        >
          <div className="h-9 w-9 rounded-xl bg-slate-200" />
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="h-7 w-20 rounded bg-slate-200" />
          <div className="h-2 w-full rounded bg-slate-100" />
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-start justify-between">
            <span
              className={`rounded-xl p-2.5 ${unavailable ? "bg-slate-100 text-slate-500" : "bg-blue-50 text-blue-600"}`}
            >
              <Icon size={18} aria-hidden="true" />
            </span>
            <span
              title={hint}
              aria-label={hint}
              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <Info size={15} aria-hidden="true" />
            </span>
          </div>
          <h3 className="text-xs font-bold uppercase tracking-[.08em] text-slate-500">
            {label}
          </h3>
          {unavailable ? (
            <div className="mt-2 flex gap-2 text-slate-500">
              <CircleEllipsis
                size={16}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <p className="text-xs font-medium leading-4">
                Dados ainda não integrados
              </p>
            </div>
          ) : (
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">
              {value}
            </p>
          )}
          <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-slate-400">
            {hint}
          </p>
        </>
      )}
    </article>
  );
});

export function TeamSummary({
  total,
  active,
  inactive,
  online,
  offline,
  newThisMonth,
}: {
  total: number;
  active: number;
  inactive: number;
  online: number;
  offline: number;
  newThisMonth: number;
}) {
  const activeWidth = total ? (active / total) * 100 : 0;
  const onlineWidth = total ? (online / total) * 100 : 0;
  const items = [
    ["Ativos", active, "bg-emerald-500"],
    ["Inativos", inactive, "bg-rose-400"],
    ["Online estimado", online, "bg-blue-500"],
    ["Offline estimado", offline, "bg-slate-400"],
    ["Novos no mês", newThisMonth, "bg-violet-500"],
  ] as const;

  return (
    <section
      aria-labelledby="team-summary-title"
      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
    >
      <div className="grid gap-5 lg:grid-cols-[220px_1fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Composição
          </p>
          <h2
            id="team-summary-title"
            className="mt-1 text-lg font-bold text-slate-950"
          >
            Resumo da equipe
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {total} corretores no conjunto atual
          </p>
        </div>
        <div className="space-y-3">
          <div
            className="flex h-2.5 overflow-hidden rounded-full bg-slate-100"
            title={`${active} ativos e ${inactive} inativos`}
          >
            <span
              className="bg-emerald-500 transition-[width]"
              style={{ width: `${activeWidth}%` }}
            />
            <span
              className="bg-rose-400 transition-[width]"
              style={{ width: `${100 - activeWidth}%` }}
            />
          </div>
          <div
            className="flex h-2 overflow-hidden rounded-full bg-slate-100"
            title={`${online} online estimados e ${offline} offline estimados`}
          >
            <span
              className="bg-blue-500 transition-[width]"
              style={{ width: `${onlineWidth}%` }}
            />
            <span
              className="bg-slate-300 transition-[width]"
              style={{ width: `${100 - onlineWidth}%` }}
            />
          </div>
          <ul
            className="flex flex-wrap gap-x-5 gap-y-2"
            aria-label="Detalhamento da equipe"
          >
            {items.map(([label, value, color]) => (
              <li
                key={label}
                className="flex items-center gap-2 text-xs text-slate-600"
              >
                <i
                  className={`h-2 w-2 rounded-full ${color}`}
                  aria-hidden="true"
                />
                <strong className="text-slate-900">{value}</strong>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function AutoRefreshStatus({
  loading,
  updatedAt,
}: {
  loading: boolean;
  updatedAt: Date;
}) {
  return (
    <span
      role="status"
      className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
    >
      <RefreshCw
        size={13}
        className={loading ? "animate-spin" : ""}
        aria-hidden="true"
      />
      {loading ? "Atualizando" : "Atualização automática ativa"}
      <span className="hidden text-emerald-600/70 sm:inline">
        ·{" "}
        {updatedAt.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </span>
  );
}
