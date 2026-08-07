"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Award,
  BriefcaseBusiness,
  MessageSquareText,
  MousePointerClick,
  Target,
  UserRound,
  UsersRound,
} from "lucide-react";
import { analyticsService } from "@/services/analytics.service";
import { userService } from "@/services/user.service";
import {
  BrokerMetric,
  ExecutiveAnalytics,
  ManagerMetric,
} from "@/types/analytics";
import { User } from "@/types/user";
import KpiCard from "@/components/dashboard/KpiCard";
import {
  AnalyticsCard,
  AnalyticsHeader,
  DateRange,
  EmptyState,
  ErrorState,
  LoadingState,
  RateBadge,
} from "./AnalyticsUi";
import { ComparisonBars, MiniLineChart } from "./AnalyticsCharts";

type Mode = "broker" | "manager";
export function PeopleDashboard({ mode }: { mode: Mode }) {
  const [users, setUsers] = useState<User[]>([]),
    [selected, setSelected] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [metrics, setMetrics] = useState<Array<BrokerMetric | ManagerMetric>>(
      [],
    ),
    [executive, setExecutive] = useState<ExecutiveAnalytics | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [people, rows, overview] = await Promise.all([
        userService.getAll({ limit: 100 }),
        mode === "broker"
          ? analyticsService.brokers({
              userId: selected || undefined,
              from: from || undefined,
              to: to || undefined,
              limit: 100,
            })
          : analyticsService.managers({
              userId: selected || undefined,
              from: from || undefined,
              to: to || undefined,
              limit: 100,
            }),
        analyticsService.executive({
          from: from || undefined,
          to: to || undefined,
        }),
      ]);
      setUsers(
        people.items.filter((user) =>
          mode === "broker"
            ? ["BROKER", "CORRETOR"].includes(user.role)
            : user.role === "MANAGER",
        ),
      );
      setMetrics(rows);
      setExecutive(overview);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível carregar o dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, [from, mode, selected, to]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  const person = users.find((user) => user.id === selected);
  const sum = (key: string) =>
    metrics.reduce(
      (total, row) =>
        total + Number((row as unknown as Record<string, unknown>)[key] ?? 0),
      0,
    );
  const won = sum("wonDeals"),
    lost = sum("lostDeals"),
    leads = sum(mode === "broker" ? "assignedLeads" : "managedLeads"),
    activity = sum(mode === "broker" ? "activities" : "activeBrokers"),
    conversion = leads ? (won / leads) * 100 : 0;
  const chart = metrics.map((row) =>
    Number((row as unknown as Record<string, unknown>).wonDeals ?? 0),
  );
  const ranking = users
    .map((user) => ({
      label: user.name,
      value: metrics
        .filter(
          (row) =>
            (mode === "broker"
              ? (row as BrokerMetric).brokerUserId
              : (row as ManagerMetric).managerUserId) === user.id,
        )
        .reduce((total, row) => total + row.wonDeals, 0),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  if (loading && !executive)
    return (
      <LoadingState
        label={`Carregando dashboard do ${mode === "broker" ? "corretor" : "gerente"}...`}
      />
    );
  return (
    <main className="space-y-6">
      <AnalyticsHeader
        eyebrow="Inteligência de equipe"
        title={
          mode === "broker" ? "Dashboard do corretor" : "Dashboard do gerente"
        }
        description={
          mode === "broker"
            ? "Performance individual, conversão, produtividade e histórico comercial."
            : "Visão consolidada da equipe, campanhas e performance dos corretores."
        }
        actions={
          <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
            <strong className="block">
              {person?.name ??
                (mode === "broker"
                  ? "Todos os corretores"
                  : "Todos os gerentes")}
            </strong>
            <span className="text-xs text-blue-100">
              {person?.organization?.name ?? "Equipe comercial"}
            </span>
          </div>
        }
      />
      {error && <ErrorState message={error} />}
      <AnalyticsCard>
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr_auto] lg:items-end">
          <label className="text-xs font-semibold text-slate-500">
            Profissional
            <select
              aria-label={
                mode === "broker" ? "Selecionar corretor" : "Selecionar gerente"
              }
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Toda a equipe</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <DateRange
            from={from}
            to={to}
            onChange={(field, value) =>
              field === "from" ? setFrom(value) : setTo(value)
            }
          />
          <button
            onClick={() => void load()}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
          >
            Atualizar
          </button>
        </div>
      </AnalyticsCard>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Leads" value={leads} icon={<UserRound />} />
        <KpiCard
          label={mode === "broker" ? "Atividades" : "Corretores ativos"}
          value={activity}
          icon={<UsersRound />}
        />
        <KpiCard label="Vendas" value={won} icon={<Target />} />
        <KpiCard
          label="Campanhas"
          value={executive?.campaigns.active ?? 0}
          icon={<BriefcaseBusiness />}
        />
        <KpiCard
          label="Mensagens"
          value={executive?.messages.sent ?? 0}
          icon={<MessageSquareText />}
        />
        <KpiCard
          label="Cliques"
          value={executive?.messages.clicked ?? 0}
          icon={<MousePointerClick />}
        />
        <KpiCard label="Conversões" value={won} icon={<Award />} />
        <AnalyticsCard>
          <p className="text-sm font-semibold text-slate-500">Conversão</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {conversion.toFixed(2)}%
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {lost} oportunidades perdidas
          </p>
        </AnalyticsCard>
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <AnalyticsCard title="Histórico mensal">
          <MiniLineChart
            points={chart.length ? chart : [0]}
            label="Histórico mensal de vendas"
          />
        </AnalyticsCard>
        <AnalyticsCard
          title={
            mode === "broker"
              ? "Ranking da equipe"
              : "Top corretores e gerentes"
          }
        >
          {ranking.length ? (
            <ComparisonBars items={ranking} />
          ) : (
            <EmptyState message="Sem dados para o ranking no período." />
          )}
        </AnalyticsCard>
      </div>
      <AnalyticsCard title="Detalhamento histórico">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="pb-3">Período</th>
                <th>Leads</th>
                <th>Vendas</th>
                <th>Perdas</th>
                <th>Conversão</th>
                <th>Produtividade</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((row) => {
                const rowLeads =
                  mode === "broker"
                    ? (row as BrokerMetric).assignedLeads
                    : (row as ManagerMetric).managedLeads;
                return (
                  <tr
                    key={row.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-4">
                      {new Date(row.bucketStart).toLocaleDateString("pt-BR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td>{rowLeads}</td>
                    <td>{row.wonDeals}</td>
                    <td>{row.lostDeals}</td>
                    <td>
                      <RateBadge
                        value={rowLeads ? (row.wonDeals / rowLeads) * 100 : 0}
                      />
                    </td>
                    <td>
                      {mode === "broker"
                        ? (row as BrokerMetric).activities
                        : (row as ManagerMetric).activeBrokers}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AnalyticsCard>
    </main>
  );
}
