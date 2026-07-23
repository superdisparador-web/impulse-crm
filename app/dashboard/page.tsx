"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarClock, CheckCircle2, Megaphone, MessageCircle, MousePointerClick, RadioTower, Users } from "lucide-react";
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

function formatNumber(value: number) { return new Intl.NumberFormat("pt-BR").format(value); }
function formatDate(value?: string | null) { return value ? new Date(value).toLocaleDateString("pt-BR") : "-"; }
function formatDateTime(value?: string | null) { return value ? new Date(value).toLocaleString("pt-BR") : "-"; }

export default function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        const data = await dashboardService.getDashboard();
        if (active) setDashboard(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Não foi possível carregar o dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadDashboard();
    return () => { active = false; };
  }, []);

  const maxLeadsByDay = useMemo(() => Math.max(1, ...(dashboard?.leadsByDay.map((item) => item.total) ?? [0])), [dashboard]);
  const maxCampaignStatus = useMemo(() => Math.max(1, ...(dashboard?.campaignsByStatus.map((item) => item.total) ?? [0])), [dashboard]);
  const maxPerformance = useMemo(() => Math.max(1, ...Object.values(dashboard?.campaignPerformance ?? { sent: 0, delivered: 0, read: 0, failed: 0, clicked: 0 })), [dashboard]);

  if (loading) return <div className="space-y-6"><PageHeader /><div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-slate-300">Carregando indicadores do dashboard...</div></div>;
  if (error) return <div className="space-y-6"><PageHeader /><div className="rounded-xl border border-red-900 bg-red-950/40 p-6 text-red-200"><AlertCircle className="mb-3 h-6 w-6" />{error}</div></div>;
  if (!dashboard) return <div className="space-y-6"><PageHeader /><EmptyState message="Nenhum dado disponível para exibir." /></div>;

  const cards = [
    ["Leads hoje", dashboard.summary.leadsToday, Users], ["Leads na semana", dashboard.summary.leadsThisWeek, Users], ["Total de leads", dashboard.summary.totalLeads, Users],
    ["Total de campanhas", dashboard.summary.totalCampaigns, Megaphone], ["Rascunhos", dashboard.summary.draftCampaigns, Megaphone], ["Agendadas", dashboard.summary.scheduledCampaigns, CalendarClock], ["Concluídas", dashboard.summary.completedCampaigns, CheckCircle2],
    ["WhatsApp conectadas", dashboard.summary.connectedWhatsappAccounts, MessageCircle], ["WhatsApp desconectadas", dashboard.summary.disconnectedWhatsappAccounts, RadioTower], ["Destinatários", dashboard.summary.totalRecipients, Users],
    ["Enviado", dashboard.summary.totalSent, Megaphone], ["Entregue", dashboard.summary.totalDelivered, CheckCircle2], ["Lido", dashboard.summary.totalRead, MessageCircle], ["Falhas", dashboard.summary.totalFailed, AlertCircle], ["Cliques", dashboard.summary.totalClicked, MousePointerClick],
  ] as const;

  return <div className="space-y-8"><PageHeader />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, Icon]) => <MetricCard key={label} label={label} value={value} icon={<Icon className="h-5 w-5" />} />)}</section>
    <section className="grid gap-6 xl:grid-cols-3"><ChartCard title="Leads por dia (7 dias)">{dashboard.leadsByDay.map((item) => <Bar key={item.date} label={formatDate(item.date)} value={item.total} max={maxLeadsByDay} />)}</ChartCard><ChartCard title="Campanhas por status">{dashboard.campaignsByStatus.map((item) => <Bar key={item.status} label={statusLabel[item.status]} value={item.total} max={maxCampaignStatus} />)}</ChartCard><ChartCard title="Desempenho de campanhas">{Object.entries(dashboard.campaignPerformance).map(([key, value]) => <Bar key={key} label={{ sent: "Enviadas", delivered: "Entregues", read: "Lidas", failed: "Falhas", clicked: "Cliques" }[key] ?? key} value={value} max={maxPerformance} />)}</ChartCard></section>
    <section className="grid gap-6 xl:grid-cols-2"><ListCard title="Últimos leads" empty="Nenhum lead recente.">{dashboard.recentLeads.map((lead) => <Row key={lead.id} title={lead.name} meta={`${lead.phone} • ${lead.assignedUser?.name ?? "Sem responsável"}`} value={formatDateTime(lead.createdAt)} />)}</ListCard><ListCard title="Últimas campanhas" empty="Nenhuma campanha recente.">{dashboard.recentCampaigns.map((campaign) => <Row key={campaign.id} title={campaign.name} meta={`${statusLabel[campaign.status]} • ${campaign.totalContacts} destinatários`} value={formatDateTime(campaign.createdAt)} />)}</ListCard><ListCard title="Próximas campanhas agendadas" empty="Nenhuma campanha agendada.">{dashboard.scheduledCampaigns.map((campaign) => <Row key={campaign.id} title={campaign.name} meta={`${campaign.totalContacts} destinatários`} value={formatDateTime(campaign.scheduledAt)} />)}</ListCard><ListCard title="Contas WhatsApp" empty="Nenhuma conta WhatsApp cadastrada.">{dashboard.whatsappAccounts.map((account) => <Row key={account.id} title={account.name} meta={account.phoneNumber} value={account.status === "ACTIVE" ? "Conectada" : "Desconectada"} />)}</ListCard></section>
    <ListCard title="Ranking de corretores" empty="Ainda não há leads atribuídos para montar o ranking.">{dashboard.topUsers.map((user, index) => <Row key={user.id} title={`${index + 1}. ${user.name}`} meta={user.email} value={`${formatNumber(user.totalLeads)} lead(s)`} />)}</ListCard>
  </div>;
}

function PageHeader() { return <header><h1 className="text-4xl font-bold text-white">Dashboard</h1><p className="mt-2 max-w-3xl text-slate-400">Visão consolidada dos leads, campanhas e conexões WhatsApp da sua organização com dados reais do CRM.</p></header>; }
function MetricCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) { return <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow"><div className="mb-4 flex items-center justify-between text-slate-400"><span className="text-sm">{label}</span><span className="rounded-lg bg-slate-800 p-2 text-blue-300">{icon}</span></div><p className="text-3xl font-bold text-white">{formatNumber(value)}</p></div>; }
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) { return <div className="rounded-xl border border-slate-800 bg-slate-900 p-5"><h2 className="mb-5 text-lg font-semibold text-white">{title}</h2><div className="space-y-4">{children}</div></div>; }
function Bar({ label, value, max }: { label: string; value: number; max: number }) { return <div><div className="mb-1 flex justify-between text-sm"><span className="text-slate-300">{label}</span><span className="font-medium text-white">{formatNumber(value)}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max(4, (value / max) * 100)}%` }} /></div></div>; }
function ListCard({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) { return <div className="rounded-xl border border-slate-800 bg-slate-900 p-5"><h2 className="mb-4 text-lg font-semibold text-white">{title}</h2>{children.length ? <div className="divide-y divide-slate-800">{children}</div> : <EmptyState message={empty} />}</div>; }
function Row({ title, meta, value }: { title: string; meta: string; value: string }) { return <div className="flex items-center justify-between gap-4 py-3"><div><p className="font-medium text-white">{title}</p><p className="text-sm text-slate-400">{meta}</p></div><span className="text-right text-sm text-slate-300">{value}</span></div>; }
function EmptyState({ message }: { message: string }) { return <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">{message}</div>; }
