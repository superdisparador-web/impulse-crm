import {
  AlertTriangle,
  Clock3,
  Goal,
  Medal,
  PauseCircle,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import StatCard from "@/components/ui/StatCard";
import {
  PipelineMetrics as Metrics,
  PipelineStage,
} from "@/types/pipeline-board";

function rankPeople(stages: PipelineStage[], role: "broker" | "manager") {
  const counts = new Map<string, number>();
  for (const card of stages.flatMap((stage) => stage.cards)) {
    const name =
      role === "broker"
        ? card.lead.assignedUser?.name
        : card.lead.managerUser?.name;
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 3);
}

function movementSeries(stages: PipelineStage[], days: number) {
  const now = new Date();
  return Array.from({ length: days }, (_, offset) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - offset - 1));
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const total = stages.reduce(
      (sum, stage) =>
        sum +
        stage.cards.filter((card) => {
          const value = card.enteredStageAt
            ? new Date(card.enteredStageAt)
            : null;
          return value && value >= date && value < next;
        }).length,
      0,
    );
    return {
      label: date
        .toLocaleDateString("pt-BR", { weekday: "short" })
        .replace(".", ""),
      total,
    };
  });
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="rounded-xl bg-blue-50 p-2 text-blue-600">{icon}</span>
      <div>
        <h2 className="font-semibold text-slate-950">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        )}
      </div>
    </div>
  );
}

function PeopleRanking({
  title,
  items,
}: {
  title: string;
  items: Array<[string, number]>;
}) {
  return (
    <Card padding="sm">
      <SectionTitle icon={<UsersRound size={18} />} title={title} />
      {items.length ? (
        <ol className="space-y-2">
          {items.map(([name, total], index) => (
            <li
              key={name}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-slate-200"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-amber-50 text-xs font-bold text-amber-700">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                {name}
              </span>
              <strong className="text-sm text-slate-950">{total}</strong>
            </li>
          ))}
        </ol>
      ) : (
        <p className="py-5 text-center text-sm text-slate-500">
          Sem dados no recorte atual
        </p>
      )}
    </Card>
  );
}

export function PipelineMetrics({
  metrics,
  stages = [],
}: {
  metrics?: Metrics;
  stages?: PipelineStage[];
}) {
  const bottleneck = stages.find(
    (stage) => stage.id === metrics?.bottleneckStageId,
  );
  const ranking = [...stages]
    .sort((a, b) => (b.total ?? b.cards.length) - (a.total ?? a.cards.length))
    .slice(0, 3);
  const brokers = rankPeople(stages, "broker");
  const managers = rankPeople(stages, "manager");
  const daily = movementSeries(stages, 7);
  const weeklyTotal = daily.reduce((sum, item) => sum + item.total, 0);
  const dailyMax = Math.max(1, ...daily.map((item) => item.total));
  const cards = [
    {
      label: "Total de leads",
      value: metrics?.total ?? 0,
      helper: "No funil atual",
      icon: TrendingUp,
    },
    {
      label: "SLA vencido",
      value: metrics?.overdueSla ?? 0,
      helper: "Exigem atenção",
      icon: AlertTriangle,
    },
    {
      label: "Gargalo do funil",
      value: bottleneck?.name ?? "—",
      helper: "Maior permanência média",
      icon: AlertTriangle,
    },
    {
      label: "Tempo médio",
      value: `${metrics?.averageStageHours ?? 0}h`,
      helper: "Em todas as etapas",
      icon: Clock3,
    },
    {
      label: "Leads parados",
      value: metrics?.stalledLeads ?? 0,
      helper: "Sem interação há 48h",
      icon: PauseCircle,
    },
    {
      label: "Meta de conversão",
      value: `${metrics?.conversionRate ?? 0}%`,
      helper: "Objetivo: 100% do funil",
      icon: Goal,
    },
  ];

  return (
    <section aria-label="Dashboard do pipeline" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {cards.map(({ icon: Icon, ...card }) => (
          <StatCard
            key={card.label}
            title={card.label}
            value={card.value}
            subtitle={card.helper}
            subtitleClassName="text-slate-500"
            className="h-full"
            icon={<Icon size={20} />}
          />
        ))}
      </div>
      <Card aria-label="Funil visual" padding="sm">
        <SectionTitle
          icon={<TrendingUp size={18} />}
          title="Funil visual"
          description="Distribuição e conversão dos leads entre as etapas."
        />
        {stages.length === 0 ? (
          <EmptyState
            title="Funil sem etapas"
            description="Adicione etapas para visualizar a distribuição dos leads."
          />
        ) : (
          <div className="flex min-w-max gap-3 overflow-x-auto pb-2">
            {stages.map((stage, index) => {
              const count = stage.total ?? stage.cards.length;
              const previous = index
                ? (stages[index - 1].total ?? stages[index - 1].cards.length)
                : count;
              const conversion = previous
                ? Math.min(100, Math.round((count / previous) * 100))
                : 0;
              return (
                <div
                  key={stage.id}
                  className="w-48 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: stage.color ?? "#2563eb" }}
                    />
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
                      {stage.name}
                    </p>
                  </div>
                  <strong className="mt-4 block text-2xl text-slate-950">
                    {count}
                  </strong>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${index ? conversion : 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs font-medium text-blue-700">
                    {index
                      ? `${conversion}% da etapa anterior`
                      : "Entrada do funil"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card padding="sm">
          <SectionTitle
            icon={<TrendingUp size={18} />}
            title="Conversão por etapa"
            description="Desempenho e tempo médio em cada etapa."
          />
          <div className="flex gap-3 overflow-x-auto pb-1">
            {stages.map((stage) => {
              const item = metrics?.stageMetrics?.[stage.id];
              return (
                <div
                  key={stage.id}
                  className="min-w-48 rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                >
                  <div className="flex justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-slate-600">
                      {stage.name}
                    </span>
                    <strong className="text-blue-700">
                      {item?.conversionRate ?? 0}%
                    </strong>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-700"
                      style={{
                        width: `${Math.min(100, item?.conversionRate ?? 0)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {item?.total ?? stage.total ?? stage.cards.length} leads ·{" "}
                    {item?.averageHours ?? 0}h
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
        <Card padding="sm">
          <SectionTitle icon={<Medal size={18} />} title="Ranking das etapas" />
          {ranking.length ? (
            <ol className="space-y-2">
              {ranking.map((stage, index) => (
                <li
                  key={stage.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-sm"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-amber-50 font-bold text-amber-700">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-slate-700">
                    {stage.name}
                  </span>
                  <strong className="text-slate-950">
                    {stage.total ?? stage.cards.length}
                  </strong>
                </li>
              ))}
            </ol>
          ) : (
            <p className="py-5 text-center text-sm text-slate-500">
              Sem etapas para classificar
            </p>
          )}
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <PeopleRanking title="Ranking de corretores" items={brokers} />
        <PeopleRanking title="Ranking de gerentes" items={managers} />
        <Card aria-label="Evolução diária e semanal" padding="sm">
          <div className="flex items-start justify-between">
            <SectionTitle
              icon={<TrendingUp size={18} />}
              title="Evolução diária"
              description="Entradas nos últimos 7 dias."
            />
            <div className="text-right">
              <strong className="text-2xl text-slate-950">{weeklyTotal}</strong>
              <p className="text-xs text-slate-500">Evolução semanal</p>
            </div>
          </div>
          <div
            className="mt-2 flex h-24 items-end gap-2"
            role="img"
            aria-label={`Evolução semanal com ${weeklyTotal} movimentações`}
          >
            {daily.map((item) => (
              <div
                key={item.label}
                className="flex h-full flex-1 flex-col justify-end gap-1"
              >
                <span className="text-center text-[10px] text-slate-500">
                  {item.total}
                </span>
                <div
                  className="min-h-1 rounded-t bg-blue-600 transition-all duration-700 hover:bg-blue-700"
                  style={{
                    height: `${Math.max(4, (item.total / dailyMax) * 100)}%`,
                  }}
                />
                <span className="text-center text-[10px] capitalize text-slate-500">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
