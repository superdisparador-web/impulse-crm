"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Megaphone,
  MessageCircle,
  MousePointerClick,
  RadioTower,
  Trophy,
  Users,
} from "lucide-react";

import BarChart from "@/components/dashboard/BarChart";
import ChartCard from "@/components/dashboard/ChartCard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardRow from "@/components/dashboard/DashboardRow";
import EmptyState from "@/components/dashboard/EmptyState";
import KpiGrid, { DashboardKpi } from "@/components/dashboard/KpiGrid";
import ListCard from "@/components/dashboard/ListCard";
import { dashboardService } from "@/services/dashboard.service";
import { DashboardResponse } from "@/types/dashboard";
import CommercialPendingAlert from "@/components/dashboard/CommercialPendingAlert";

const statusLabel: Record<string, string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Agendada",
  PROCESSING: "Processando",
  PAUSED: "Pausada",
  COMPLETED: "Concluída",
  CANCELED: "Cancelada",
  FAILED: "Falhou",
};

const performanceLabel: Record<string, string> = {
  sent: "Enviadas",
  delivered: "Entregues",
  read: "Lidas",
  failed: "Falhas",
  clicked: "Cliques",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("pt-BR") : "-";
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString("pt-BR") : "-";
}

function formatPercentage(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(value);
}

function getCampaignCountByStatus(
  campaigns: DashboardResponse["campaignsByStatus"],
  status: string,
) {
  return campaigns.find((campaign) => campaign.status === status)?.total ?? 0;
}

function formatCurrentDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function formatCurrentWeekday(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
  }).format(value);
}

function formatCurrentTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function getGreeting(value: Date, userName: string) {
  const hour = value.getHours();

  if (hour < 12) {
    return `Bom dia, ${userName} 👋`;
  }

  if (hour < 18) {
    return `Boa tarde, ${userName} 👋`;
  }

  return `Boa noite, ${userName} 👋`;
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);

  useEffect(() => {
    const initialTimeoutId = window.setTimeout(() => {
      setCurrentDateTime(new Date());
    }, 0);

    const intervalId = window.setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60_000);

    return () => {
      window.clearTimeout(initialTimeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const data = await dashboardService.getDashboard();

        if (active) {
          setDashboard(data);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Não foi possível carregar o dashboard.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const maxLeadsByDay = useMemo(
    () =>
      Math.max(1, ...(dashboard?.leadsByDay.map((item) => item.total) ?? [0])),
    [dashboard],
  );

  const maxCampaignStatus = useMemo(
    () =>
      Math.max(
        1,
        ...(dashboard?.campaignsByStatus.map((item) => item.total) ?? [0]),
      ),
    [dashboard],
  );

  const maxPerformance = useMemo(
    () =>
      Math.max(
        1,
        ...Object.values(
          dashboard?.campaignPerformance ?? {
            sent: 0,
            delivered: 0,
            read: 0,
            failed: 0,
            clicked: 0,
          },
        ),
      ),
    [dashboard],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardHeader />

        <div
          className="relative flex min-h-52 items-end overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-950 p-6 shadow-md sm:p-8"
          aria-live="polite"
          aria-busy="true"
        >
          <Image
            src="/branding/loader-background.png"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 80vw"
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-slate-950/35" />
          <div className="relative flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white backdrop-blur-md">
            <span
              aria-hidden="true"
              className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200/30 border-t-blue-300 motion-reduce:animate-pulse"
            />
            <p className="font-medium">
              Carregando indicadores do dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardHeader />

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <AlertCircle className="mb-3 h-6 w-6" />
          {error}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="space-y-6">
        <DashboardHeader />
        <EmptyState message="Nenhum dado disponível para exibir." />
      </div>
    );
  }

  const kpis: DashboardKpi[] = [
    {
      label: "Leads hoje",
      value: dashboard.summary.leadsToday,
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "Leads na semana",
      value: dashboard.summary.leadsThisWeek,
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "Total de leads",
      value: dashboard.summary.totalLeads,
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "Total de campanhas",
      value: dashboard.summary.totalCampaigns,
      icon: <Megaphone className="h-5 w-5" />,
    },
    {
      label: "Rascunhos",
      value: dashboard.summary.draftCampaigns,
      icon: <Megaphone className="h-5 w-5" />,
    },
    {
      label: "Agendadas",
      value: dashboard.summary.scheduledCampaigns,
      icon: <CalendarClock className="h-5 w-5" />,
    },
    {
      label: "Concluídas",
      value: dashboard.summary.completedCampaigns,
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    {
      label: "WhatsApp conectadas",
      value: dashboard.summary.connectedWhatsappAccounts,
      icon: <MessageCircle className="h-5 w-5" />,
    },
    {
      label: "WhatsApp desconectadas",
      value: dashboard.summary.disconnectedWhatsappAccounts,
      icon: <RadioTower className="h-5 w-5" />,
    },
    {
      label: "Destinatários",
      value: dashboard.summary.totalRecipients,
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "Enviadas",
      value: dashboard.summary.totalSent,
      icon: <Megaphone className="h-5 w-5" />,
    },
    {
      label: "Entregues",
      value: dashboard.summary.totalDelivered,
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    {
      label: "Lidas",
      value: dashboard.summary.totalRead,
      icon: <MessageCircle className="h-5 w-5" />,
    },
    {
      label: "Falhas",
      value: dashboard.summary.totalFailed,
      icon: <AlertCircle className="h-5 w-5" />,
    },
    {
      label: "Cliques",
      value: dashboard.summary.totalClicked,
      icon: <MousePointerClick className="h-5 w-5" />,
    },
  ];

  const processingCampaigns = getCampaignCountByStatus(
    dashboard.campaignsByStatus,
    "PROCESSING",
  );
  const pausedCampaigns = getCampaignCountByStatus(
    dashboard.campaignsByStatus,
    "PAUSED",
  );
  const { sent, delivered, read, clicked } = dashboard.campaignPerformance;
  const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
  const readRate = delivered > 0 ? (read / delivered) * 100 : 0;
  const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;
  const topUser = dashboard.topUsers[0];
  const userName = "Rodrigo";

  return (
    <div className="relative isolate space-y-7 overflow-hidden rounded-3xl p-1 sm:p-3">
      <Image
        src="/branding/dashboard-wallpaper.png"
        alt=""
        fill
        sizes="(max-width: 1024px) 100vw, 80vw"
        className="-z-10 object-cover opacity-[0.07]"
      />

      <section className="relative min-h-[540px] overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-[0_28px_70px_-28px_rgba(15,23,42,0.75)] sm:min-h-[580px] lg:min-h-[440px]">
        <Image
          src="/branding/dashboard-hero.png"
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 80vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/48 to-slate-950/10" />
        <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-slate-950/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-slate-950/80 to-transparent" />

        <div className="relative z-10 flex min-h-[540px] flex-col justify-between gap-5 p-5 pb-0 text-white sm:min-h-[580px] sm:p-7 sm:pb-0 lg:min-h-[440px] lg:p-8 lg:pb-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <header className="max-w-md lg:max-w-[42%]">
              <span className="inline-flex rounded-full border border-cyan-300/25 bg-blue-950/55 px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-cyan-200 backdrop-blur-md">
                Impulse CRM
              </span>
              <p className="mt-3 text-sm font-semibold tracking-wide text-cyan-100 sm:text-base">
                {currentDateTime
                  ? getGreeting(currentDateTime, userName)
                  : "Olá, Rodrigo 👋"}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-[-0.025em] text-white sm:text-3xl">
                Bem-vindo ao Impulse CRM
              </h1>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-200 sm:text-base">
                Seu centro de comando para campanhas, WhatsApp e gestão de
                leads.
              </p>
            </header>

            <aside
              className="group w-full rounded-2xl border border-white/15 bg-slate-950/50 p-3.5 shadow-lg shadow-slate-950/20 backdrop-blur-md transition duration-300 hover:border-cyan-300/25 hover:bg-slate-950/60 hover:shadow-cyan-950/30 motion-reduce:transition-none sm:w-auto sm:min-w-52"
              aria-label="Data e hora da última atualização"
              aria-live="polite"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <span
                  className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                  aria-hidden="true"
                />
                Última atualização
              </div>
              {currentDateTime ? (
                <div className="mt-2 grid grid-cols-[1fr_auto] items-end gap-4">
                  <div>
                    <p className="font-semibold capitalize text-white">
                      {formatCurrentWeekday(currentDateTime)}
                    </p>
                    <p className="mt-0.5 text-sm capitalize text-slate-300">
                      {formatCurrentDate(currentDateTime)}
                    </p>
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-white transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none">
                    {formatCurrentTime(currentDateTime)}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-300">
                  Atualizando data e hora…
                </p>
              )}
            </aside>
          </div>

          <div
            className="grid grid-cols-2 overflow-hidden rounded-t-2xl border-x border-t border-white/15 bg-blue-950/65 shadow-[0_-10px_30px_-20px_rgba(34,211,238,0.35)] backdrop-blur-xl sm:grid-cols-4"
            aria-label="Resumo do dashboard"
          >
            <article className="border-b border-white/10 p-3 transition-colors duration-200 hover:bg-cyan-300/[0.06] motion-reduce:transition-none sm:border-b-0 sm:p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <Users className="h-4 w-4 text-cyan-300" aria-hidden="true" />
                Leads na semana
              </div>
              <p className="mt-2 text-2xl font-bold text-white">
                {formatNumber(dashboard.summary.leadsThisWeek)}
              </p>
              <p className="mt-1 text-xs text-slate-300">
                Novos contatos recebidos
              </p>
            </article>

            <article className="border-b border-l border-white/10 p-3 transition-colors duration-200 hover:bg-cyan-300/[0.06] motion-reduce:transition-none sm:border-b-0 sm:p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <Megaphone
                  className="h-4 w-4 text-cyan-300"
                  aria-hidden="true"
                />
                Campanhas
              </div>
              <p className="mt-2 text-2xl font-bold text-white">
                {formatNumber(processingCampaigns)}{" "}
                <span className="block text-xs font-medium text-slate-300 xl:inline xl:text-sm">
                  em processamento
                </span>
              </p>
              <p className="mt-1 text-xs text-slate-300">
                {formatNumber(dashboard.summary.scheduledCampaigns)} agendadas •{" "}
                {formatNumber(pausedCampaigns)} pausadas
              </p>
            </article>

            <article className="p-3 transition-colors duration-200 hover:bg-cyan-300/[0.06] motion-reduce:transition-none sm:border-l sm:border-white/10 sm:p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <MousePointerClick
                  className="h-4 w-4 text-cyan-300"
                  aria-hidden="true"
                />
                Engajamento
              </div>
              <p className="mt-2 text-2xl font-bold text-white">
                {formatPercentage(readRate)}%{" "}
                <span className="block text-xs font-medium text-slate-300 xl:inline xl:text-sm">
                  de leitura
                </span>
              </p>
              <p className="mt-1 text-xs text-slate-300">
                {formatPercentage(deliveryRate)}% entrega •{" "}
                {formatPercentage(clickRate)}% cliques
              </p>
            </article>

            <article className="border-l border-white/10 p-3 transition-colors duration-200 hover:bg-cyan-300/[0.06] motion-reduce:transition-none sm:p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <Trophy className="h-4 w-4 text-cyan-300" aria-hidden="true" />
                Top corretor
              </div>
              <p className="mt-2 truncate text-xl font-bold text-white">
                {topUser?.name ?? "Ranking em formação"}
              </p>
              <p className="mt-1 text-xs text-slate-300">
                {topUser
                  ? `${formatNumber(topUser.totalLeads)} lead(s) atribuído(s)`
                  : "Aguardando leads atribuídos"}
              </p>
            </article>
          </div>
        </div>
      </section>

      <CommercialPendingAlert />

      <KpiGrid items={kpis} />

      <section className="grid gap-6 xl:grid-cols-3">
        <ChartCard title="Leads por dia — últimos 7 dias">
          {dashboard.leadsByDay.map((item) => (
            <BarChart
              key={item.date}
              label={formatDate(item.date)}
              value={item.total}
              max={maxLeadsByDay}
            />
          ))}
        </ChartCard>

        <ChartCard title="Campanhas por status">
          {dashboard.campaignsByStatus.map((item) => (
            <BarChart
              key={item.status}
              label={statusLabel[item.status] ?? item.status}
              value={item.total}
              max={maxCampaignStatus}
            />
          ))}
        </ChartCard>

        <ChartCard title="Desempenho das campanhas">
          {Object.entries(dashboard.campaignPerformance).map(([key, value]) => (
            <BarChart
              key={key}
              label={performanceLabel[key] ?? key}
              value={value}
              max={maxPerformance}
            />
          ))}
        </ChartCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ListCard
          title="Últimos leads"
          emptyMessage="Nenhum lead recente."
          hasItems={dashboard.recentLeads.length > 0}
        >
          {dashboard.recentLeads.map((lead) => (
            <DashboardRow
              key={lead.id}
              title={lead.name}
              meta={`${lead.phone} • ${
                lead.assignedUser?.name ?? "Sem responsável"
              }`}
              value={formatDateTime(lead.createdAt)}
            />
          ))}
        </ListCard>

        <ListCard
          title="Últimas campanhas"
          emptyMessage="Nenhuma campanha recente."
          hasItems={dashboard.recentCampaigns.length > 0}
        >
          {dashboard.recentCampaigns.map((campaign) => (
            <DashboardRow
              key={campaign.id}
              title={campaign.name}
              meta={`${
                statusLabel[campaign.status] ?? campaign.status
              } • ${formatNumber(campaign.totalContacts)} destinatários`}
              value={formatDateTime(campaign.createdAt)}
            />
          ))}
        </ListCard>

        <ListCard
          title="Próximas campanhas agendadas"
          emptyMessage="Nenhuma campanha agendada."
          hasItems={dashboard.scheduledCampaigns.length > 0}
        >
          {dashboard.scheduledCampaigns.map((campaign) => (
            <DashboardRow
              key={campaign.id}
              title={campaign.name}
              meta={`${formatNumber(campaign.totalContacts)} destinatários`}
              value={formatDateTime(campaign.scheduledAt)}
            />
          ))}
        </ListCard>

        <ListCard
          title="Contas do WhatsApp"
          emptyMessage="Nenhuma conta WhatsApp cadastrada."
          hasItems={dashboard.whatsappAccounts.length > 0}
        >
          {dashboard.whatsappAccounts.map((account) => (
            <DashboardRow
              key={account.id}
              title={account.name}
              meta={account.phoneNumber}
              value={account.status === "ACTIVE" ? "Conectada" : "Desconectada"}
            />
          ))}
        </ListCard>
      </section>

      <ListCard
        title="Ranking de corretores"
        emptyMessage="Ainda não há leads atribuídos para montar o ranking."
        hasItems={dashboard.topUsers.length > 0}
      >
        {dashboard.topUsers.map((user, index) => (
          <DashboardRow
            key={user.id}
            title={`${index + 1}. ${user.name}`}
            meta={user.email}
            value={`${formatNumber(user.totalLeads)} lead(s)`}
          />
        ))}
      </ListCard>
    </div>
  );
}
