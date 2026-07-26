"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Megaphone,
  MessageCircle,
  MousePointerClick,
  RadioTower,
  Users,
} from "lucide-react";

import BarChart from "@/components/dashboard/BarChart";
import ChartCard from "@/components/dashboard/ChartCard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardRow from "@/components/dashboard/DashboardRow";
import EmptyState from "@/components/dashboard/EmptyState";
import KpiGrid, {
  DashboardKpi,
} from "@/components/dashboard/KpiGrid";
import ListCard from "@/components/dashboard/ListCard";
import { dashboardService } from "@/services/dashboard.service";
import { DashboardResponse } from "@/types/dashboard";

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
  return value
    ? new Date(value).toLocaleDateString("pt-BR")
    : "-";
}

function formatDateTime(value?: string | null) {
  return value
    ? new Date(value).toLocaleString("pt-BR")
    : "-";
}

export default function DashboardPage() {
  const [dashboard, setDashboard] =
    useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const data =
          await dashboardService.getDashboard();

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
      Math.max(
        1,
        ...(dashboard?.leadsByDay.map(
          (item) => item.total,
        ) ?? [0]),
      ),
    [dashboard],
  );

  const maxCampaignStatus = useMemo(
    () =>
      Math.max(
        1,
        ...(dashboard?.campaignsByStatus.map(
          (item) => item.total,
        ) ?? [0]),
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

        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
          Carregando indicadores do dashboard...
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
      value:
        dashboard.summary.connectedWhatsappAccounts,
      icon: <MessageCircle className="h-5 w-5" />,
    },
    {
      label: "WhatsApp desconectadas",
      value:
        dashboard.summary.disconnectedWhatsappAccounts,
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

  return (
    <div className="space-y-8">
      <DashboardHeader />

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
          {dashboard.campaignsByStatus.map(
            (item) => (
              <BarChart
                key={item.status}
                label={
                  statusLabel[item.status] ??
                  item.status
                }
                value={item.total}
                max={maxCampaignStatus}
              />
            ),
          )}
        </ChartCard>

        <ChartCard title="Desempenho das campanhas">
          {Object.entries(
            dashboard.campaignPerformance,
          ).map(([key, value]) => (
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
                lead.assignedUser?.name ??
                "Sem responsável"
              }`}
              value={formatDateTime(lead.createdAt)}
            />
          ))}
        </ListCard>

        <ListCard
          title="Últimas campanhas"
          emptyMessage="Nenhuma campanha recente."
          hasItems={
            dashboard.recentCampaigns.length > 0
          }
        >
          {dashboard.recentCampaigns.map(
            (campaign) => (
              <DashboardRow
                key={campaign.id}
                title={campaign.name}
                meta={`${
                  statusLabel[campaign.status] ??
                  campaign.status
                } • ${formatNumber(
                  campaign.totalContacts,
                )} destinatários`}
                value={formatDateTime(
                  campaign.createdAt,
                )}
              />
            ),
          )}
        </ListCard>

        <ListCard
          title="Próximas campanhas agendadas"
          emptyMessage="Nenhuma campanha agendada."
          hasItems={
            dashboard.scheduledCampaigns.length > 0
          }
        >
          {dashboard.scheduledCampaigns.map(
            (campaign) => (
              <DashboardRow
                key={campaign.id}
                title={campaign.name}
                meta={`${formatNumber(
                  campaign.totalContacts,
                )} destinatários`}
                value={formatDateTime(
                  campaign.scheduledAt,
                )}
              />
            ),
          )}
        </ListCard>

        <ListCard
          title="Contas do WhatsApp"
          emptyMessage="Nenhuma conta WhatsApp cadastrada."
          hasItems={
            dashboard.whatsappAccounts.length > 0
          }
        >
          {dashboard.whatsappAccounts.map(
            (account) => (
              <DashboardRow
                key={account.id}
                title={account.name}
                meta={account.phoneNumber}
                value={
                  account.status === "ACTIVE"
                    ? "Conectada"
                    : "Desconectada"
                }
              />
            ),
          )}
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
            value={`${formatNumber(
              user.totalLeads,
            )} lead(s)`}
          />
        ))}
      </ListCard>
    </div>
  );
}
