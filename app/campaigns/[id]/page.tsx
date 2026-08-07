"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { campaignsService } from "@/services/campaigns.service";
import { Campaign } from "@/types/campaign";
import { OperationalRecipient } from "@/types/campaign";
import Modal from "@/components/ui/Modal";
import Badge, { BadgeVariant } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { CampaignIntelligence } from "@/components/analytics/CampaignIntelligence";
import {
  canCancelCampaign,
  primaryCampaignAction,
} from "../campaign-operational-ui.mjs";
import { useCampaignProgress } from "@/hooks/useCampaignProgress";
import {
  AlertCircle,
  Archive,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Copy,
  Download,
  Eye,
  FileText,
  Hourglass,
  Inbox,
  LoaderCircle,
  MessageCircle,
  MousePointerClick,
  Pencil,
  Phone,
  Play,
  RotateCcw,
  Send,
  UserRound,
  XCircle,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  READY: "Pronta",
  SCHEDULED: "Agendada",
  RUNNING: "Em execução",
  PAUSED: "Pausada",
  COMPLETED: "Concluída",
  COMPLETED_WITH_ERRORS: "Concluída com falhas",
  CANCELED: "Cancelada",
  FAILED: "Falhou",
};

const statusVariants: Record<string, BadgeVariant> = {
  DRAFT: "neutral",
  READY: "primary",
  SCHEDULED: "info",
  RUNNING: "success",
  PAUSED: "warning",
  COMPLETED: "success",
  COMPLETED_WITH_ERRORS: "warning",
  CANCELED: "neutral",
  FAILED: "danger",
};

const metricVisuals = [
  { icon: BarChart3, color: "bg-slate-100 text-slate-600" },
  { icon: Inbox, color: "bg-blue-50 text-blue-600" },
  { icon: LoaderCircle, color: "bg-violet-50 text-violet-600" },
  { icon: Send, color: "bg-blue-50 text-blue-600" },
  { icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
  { icon: Eye, color: "bg-cyan-50 text-cyan-600" },
  { icon: MousePointerClick, color: "bg-indigo-50 text-indigo-600" },
  { icon: AlertCircle, color: "bg-amber-50 text-amber-600" },
  { icon: XCircle, color: "bg-red-50 text-red-600" },
  { icon: XCircle, color: "bg-slate-100 text-slate-600" },
  { icon: CircleDashed, color: "bg-gray-100 text-gray-600" },
  { icon: Hourglass, color: "bg-orange-50 text-orange-600" },
] as const;

const recipientStatusLabels: Record<string, string> = {
  PENDING: "Pendente",
  QUEUED: "Na fila",
  PROCESSING: "Processando",
  SENT: "Enviada",
  DELIVERED: "Entregue",
  READ: "Lida",
  FAILED_RETRYABLE: "Falha temporária",
  FAILED_PERMANENT: "Falha permanente",
  CANCELED: "Cancelada",
  UNKNOWN: "Desconhecido",
};

const recipientStatusVariants: Record<string, BadgeVariant> = {
  PENDING: "orange",
  QUEUED: "primary",
  PROCESSING: "purple",
  SENT: "blue",
  DELIVERED: "success",
  READ: "info",
  FAILED_RETRYABLE: "warning",
  FAILED_PERMANENT: "danger",
  CANCELED: "neutral",
  UNKNOWN: "gray",
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [recipients, setRecipients] = useState<OperationalRecipient[]>([]);
  const [recipientPage, setRecipientPage] = useState(1);
  const [recipientPages, setRecipientPages] = useState(1);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientStatus, setRecipientStatus] = useState("");
  const [modal, setModal] = useState<
    "start" | "schedule" | "pause" | "cancel" | null
  >(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await campaignsService.getCampaignById(id);

        if (!active) return;

        setError("");
        setCampaign(data);
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error ? err.message : "Erro ao carregar campanha.",
        );
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    void campaignsService
      .recipients(id, {
        page: recipientPage,
        search: recipientSearch,
        status: recipientStatus || undefined,
      })
      .then((result) => {
        if (active) {
          setRecipients(result.items);
          setRecipientPages(result.meta.totalPages);
        }
      })
      .catch((error) => {
        if (active)
          setError(
            error instanceof Error
              ? error.message
              : "Erro ao carregar destinatários.",
          );
      });
    return () => {
      active = false;
    };
  }, [id, recipientPage, recipientSearch, recipientStatus]);

  const persistedStatus = campaign?.status;
  const { progress, error: progressError } = useCampaignProgress(
    id,
    persistedStatus,
  );
  const campaignStatus = progress?.status ?? persistedStatus;

  async function operate(action: "validate" | "start" | "pause" | "resume") {
    if (actionLoading) return;

    setActionLoading(true);
    setError("");

    try {
      if (action === "validate") {
        const result = await campaignsService.validateCampaign(id);

        if (!result.valid) {
          throw new Error(
            result.reasons.map((reason) => reason.message).join("; "),
          );
        }
      } else if (action === "start") {
        await campaignsService.startCampaign(id);
      } else if (action === "pause") {
        await campaignsService.pauseCampaign(id);
      } else {
        await campaignsService.resumeCampaign(id);
      }

      setCampaign(await campaignsService.getCampaignById(id));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível executar a ação.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function cancelCampaign() {
    if (actionLoading) return;

    setActionLoading(true);
    setError("");

    try {
      setCampaign(await campaignsService.cancelCampaign(id, cancelReason));
      setModal(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao cancelar campanha.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function scheduleCampaign() {
    if (!scheduledAt) return;
    setActionLoading(true);
    try {
      setCampaign(
        await campaignsService.scheduleCampaign(
          id,
          new Date(scheduledAt).toISOString(),
        ),
      );
      setModal(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao agendar campanha.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  if (error && !campaign) {
    return (
      <main className="mx-auto w-full max-w-[1600px] text-slate-900">
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          {error || progressError}
        </div>
      </main>
    );
  }

  if (!campaign)
    return (
      <main
        className="mx-auto w-full max-w-[1600px] space-y-6"
        aria-label="Carregando campanha"
      >
        <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      </main>
    );

  const metrics = [
    ["Total", progress?.total ?? campaign.totalContacts],
    ["Na fila", progress?.queued ?? campaign.totalQueued],
    ["Processando", progress?.processing ?? 0],
    ["Enviadas", progress?.sent ?? campaign.totalSent],
    ["Entregues", progress?.delivered ?? campaign.totalDelivered],
    ["Lidas", progress?.read ?? campaign.totalRead],
    ["Cliques", progress?.clicked ?? campaign.totalClicked],
    ["Falhas temporárias", progress?.failedRetryable ?? 0],
    ["Falhas permanentes", progress?.failedPermanent ?? campaign.totalFailed],
    ["Cancelados", progress?.canceled ?? 0],
    ["Desconhecidos", progress?.unknown ?? 0],
    ["Pendentes", progress?.pending ?? 0],
  ] as const;
  const action = primaryCampaignAction(campaignStatus) as
    "validate" | "start" | "pause" | "resume" | null;

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 rounded-3xl bg-slate-50 text-slate-900">
      <header className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex items-center gap-1.5 text-sm text-slate-500"
          >
            <Link
              href="/campaigns"
              className="font-medium transition hover:text-blue-600 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Campanhas
            </Link>
            <ChevronRight
              className="h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <span aria-current="page">Detalhes</span>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="break-words text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {campaign.name}
            </h1>
            <Badge variant={statusVariants[campaignStatus ?? ""] ?? "neutral"}>
              {statusLabels[campaignStatus ?? ""] ?? campaignStatus}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {campaign.campaignType} · Criada em{" "}
            {new Date(campaign.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 xl:max-w-3xl xl:justify-end">
          {action && (
            <Button
              variant={action === "pause" ? "secondary" : "success"}
              loading={actionLoading}
              onClick={() =>
                action === "validate" || action === "resume"
                  ? void operate(action)
                  : setModal(action)
              }
            >
              <Play className="h-4 w-4" />
              {action === "validate"
                ? "Validar"
                : action === "start"
                  ? "Iniciar"
                  : action === "pause"
                    ? "Pausar"
                    : "Retomar"}
            </Button>
          )}
          {campaign.status === "READY" && (
            <Button onClick={() => setModal("schedule")}>
              <CalendarClock className="h-4 w-4" />
              Agendar
            </Button>
          )}
          {campaign.status === "DRAFT" && (
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              href={`/campaigns/${id}/edit`}
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
          )}
          <Button
            variant="secondary"
            disabled={actionLoading}
            onClick={() =>
              void campaignsService
                .duplicateCampaign(id)
                .then((copy) =>
                  location.assign(`/campaigns/new?draft=${copy.id}`),
                )
                .catch((err) =>
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Erro ao duplicar campanha.",
                  ),
                )
            }
          >
            <Copy className="h-4 w-4" />
            Duplicar campanha
          </Button>
          <Button
            variant="outline"
            disabled={actionLoading}
            onClick={() =>
              void campaignsService
                .archiveCampaign(id, !campaign.archivedAt)
                .then(setCampaign)
                .catch((err) =>
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Erro ao arquivar campanha.",
                  ),
                )
            }
          >
            {campaign.archivedAt ? (
              <RotateCcw className="h-4 w-4" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
            {campaign.archivedAt ? "Desarquivar" : "Arquivar"}
          </Button>
          {canCancelCampaign(campaignStatus) && (
            <Button
              variant="outline"
              className="border-red-300 text-red-700 hover:border-red-400 hover:bg-red-50"
              disabled={
                actionLoading ||
                ["COMPLETED", "COMPLETED_WITH_ERRORS", "CANCELED"].includes(
                  campaign.status,
                )
              }
              onClick={() => setModal("cancel")}
            >
              <XCircle className="h-4 w-4" />
              Cancelar
            </Button>
          )}
          {["COMPLETED", "COMPLETED_WITH_ERRORS", "FAILED"].includes(
            campaign.status,
          ) && (
            <Button
              variant="secondary"
              onClick={() => void campaignsService.downloadResults(id)}
            >
              <Download className="h-4 w-4" />
              Exportar resultados
            </Button>
          )}
        </div>
      </header>

      {progress ? (
        <Card padding="lg" aria-label="Progresso da campanha">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Progresso operacional
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Acompanhamento dos envios em tempo real
              </p>
            </div>
            <strong className="text-3xl font-bold tracking-tight text-blue-600">
              {progress.percentCompleted}%
            </strong>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.percentCompleted}
          >
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${progress.percentCompleted}%` }}
            />
          </div>
          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {[
              ["Concluídos", progress.completed],
              ["Pendentes", progress.pending],
              ["Velocidade atual", `${progress.currentPerMinute ?? 0}/min`],
              [
                "Média",
                `${progress.averagePerMinute ?? Math.round(progress.averagePerSecond * 60)}/min`,
              ],
              ["ETA", `${progress.etaSeconds ?? "-"}s`],
              [
                "Previsão",
                progress.estimatedCompletionAt
                  ? new Date(progress.estimatedCompletionAt).toLocaleString()
                  : "-",
              ],
              [
                "Última atualização",
                new Date(progress.updatedAt).toLocaleString(),
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {label}
                </p>
                <p className="mt-1 break-words font-semibold text-slate-900">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card padding="lg" aria-label="Progresso da campanha indisponível">
          <div className="flex flex-col items-center py-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <BarChart3 className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Campanha ainda não iniciada
            </h2>
            <p className="mt-1 max-w-lg text-sm text-slate-500">
              Os indicadores de progresso aparecerão aqui assim que o
              processamento da campanha começar.
            </p>
          </div>
        </Card>
      )}

      {(error || progressError) && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          {error || progressError}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="h-full">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </span>
            <h2 className="font-semibold text-slate-700">Informações gerais</h2>
          </div>
          <dl className="mt-5 divide-y divide-slate-100 text-sm">
            <div className="py-3 first:pt-0">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Descrição
              </dt>
              <dd className="mt-1.5 leading-6 text-slate-900">
                {campaign.description || "Nenhuma descrição informada"}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-slate-500">Criada por</dt>
              <dd className="text-right font-medium text-slate-900">
                {campaign.createdBy?.name ?? "Não informado"}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-slate-500">Criada em</dt>
              <dd className="text-right font-medium text-slate-900">
                {new Date(campaign.createdAt).toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between gap-4 pt-3">
              <dt className="text-slate-500">Agendada</dt>
              <dd className="text-right font-medium text-slate-900">
                {campaign.scheduledAt
                  ? new Date(campaign.scheduledAt).toLocaleString()
                  : "Não agendada"}
              </dd>
            </div>
          </dl>
        </Card>
        <Card className="h-full">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50 text-cyan-600">
              <Phone className="h-5 w-5" />
            </span>
            <h2 className="font-semibold text-slate-700">Conta</h2>
          </div>
          <dl className="mt-5 divide-y divide-slate-100 text-sm">
            <div className="pb-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Conta conectada
              </dt>
              <dd className="mt-1.5 text-lg font-semibold text-slate-900">
                {campaign.whatsappAccount?.name ?? "Nenhuma conta informada"}
              </dd>
            </div>
            <div className="pt-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Telefone
              </dt>
              <dd className="mt-1.5 font-medium text-slate-900">
                {campaign.whatsappAccount?.phoneNumber || "Não disponível"}
              </dd>
            </div>
          </dl>
        </Card>
        <Card className="h-full">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50 text-violet-600">
              <MessageCircle className="h-5 w-5" />
            </span>
            <h2 className="font-semibold text-slate-700">Template</h2>
          </div>
          <dl className="mt-5 divide-y divide-slate-100 text-sm">
            <div className="pb-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Modelo da mensagem
              </dt>
              <dd className="mt-1.5 text-lg font-semibold text-slate-900">
                {campaign.whatsappTemplate?.name ?? "Nenhum template informado"}
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Categoria
                </dt>
                <dd className="mt-1.5 font-medium text-slate-900">
                  {campaign.whatsappTemplate?.category || "Não informada"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Idioma
                </dt>
                <dd className="mt-1.5 font-medium text-slate-900">
                  {campaign.whatsappTemplate?.language || "Não informado"}
                </dd>
              </div>
            </div>
          </dl>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value], index) => {
          const Icon = metricVisuals[index].icon;
          return (
            <Card key={label} padding="sm" className="group h-full">
              <div className="flex min-h-20 items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{label}</p>
                  <strong className="mt-2 block text-3xl font-bold tracking-tight text-slate-900">
                    {value}
                  </strong>
                </div>
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105 ${metricVisuals[index].color}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </Card>
          );
        })}
      </section>

      <CampaignIntelligence
        campaignId={id}
        contacts={progress?.total ?? campaign.totalContacts ?? 0}
        sent={progress?.sent ?? campaign.totalSent ?? 0}
        delivered={progress?.delivered ?? campaign.totalDelivered ?? 0}
        read={progress?.read ?? campaign.totalRead ?? 0}
        clicked={campaign.totalClicked ?? 0}
      />

      <Card padding="none" className="overflow-hidden">
        <section aria-labelledby="recipients-title">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:flex-wrap sm:items-end sm:p-6">
            <div className="mr-auto">
              <h2
                id="recipients-title"
                className="text-xl font-semibold text-slate-900"
              >
                Destinatários e erros
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Consulte o status individual de cada envio.
              </p>
            </div>
            <label className="w-full text-xs font-medium text-slate-500 sm:w-64">
              Buscar destinatário
              <input
                aria-label="Buscar destinatário"
                className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Nome ou telefone"
                value={recipientSearch}
                onChange={(e) => {
                  setRecipientSearch(e.target.value);
                  setRecipientPage(1);
                }}
              />
            </label>
            <label className="w-full text-xs font-medium text-slate-500 sm:w-52">
              Status
              <select
                aria-label="Filtrar status"
                className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={recipientStatus}
                onChange={(e) => {
                  setRecipientStatus(e.target.value);
                  setRecipientPage(1);
                }}
              >
                <option value="">Todos os status</option>
                {Object.entries(recipientStatusLabels).map(
                  ([status, label]) => (
                    <option key={status} value={status}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>
          <TableContainer
            compact
            className="rounded-none border-x-0 border-b-0 shadow-none"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.length ? (
                  recipients.map((recipient) => (
                    <TableRow key={recipient.id}>
                      <TableCell className="font-medium text-slate-900">
                        <span className="flex items-center gap-2">
                          <UserRound className="h-4 w-4 text-slate-500" />
                          {recipient.name}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-slate-600">
                        {recipient.phone}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            recipientStatusVariants[recipient.status] ??
                            "neutral"
                          }
                        >
                          {recipientStatusLabels[recipient.status] ??
                            recipient.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {recipient.assignedUser?.name ?? "-"}
                      </TableCell>
                      <TableCell>{recipient.attemptCount}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {recipient.sentAt
                          ? new Date(recipient.sentAt).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell
                        className={
                          recipient.errorMessage
                            ? "max-w-xs text-red-600"
                            : "max-w-xs text-slate-500"
                        }
                      >
                        {recipient.errorMessage ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <Inbox className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                      <strong className="block text-slate-700">
                        Nenhum destinatário encontrado
                      </strong>
                      <span className="mt-1 block text-slate-500">
                        A campanha ainda não possui dados para os filtros
                        selecionados.
                      </span>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/70 p-4">
              <Button
                size="sm"
                variant="secondary"
                disabled={recipientPage <= 1}
                onClick={() => setRecipientPage((page) => page - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm font-medium text-slate-600">
                {recipientPage} / {recipientPages}
              </span>
              <Button
                size="sm"
                variant="secondary"
                disabled={recipientPage >= recipientPages}
                onClick={() => setRecipientPage((page) => page + 1)}
              >
                Próxima
              </Button>
            </div>
          </TableContainer>
        </section>
      </Card>
      <Modal
        isOpen={modal !== null}
        title={
          modal === "schedule"
            ? "Agendar campanha"
            : modal === "cancel"
              ? "Cancelar campanha"
              : modal === "pause"
                ? "Pausar campanha"
                : "Iniciar campanha"
        }
        onClose={() => !actionLoading && setModal(null)}
      >
        <div className="space-y-4 text-slate-700">
          <p>
            {modal === "cancel"
              ? "Os destinatários ainda não processados serão cancelados."
              : modal === "pause"
                ? "Novos envios serão interrompidos após as chamadas atuais."
                : modal === "schedule"
                  ? "Informe uma data e hora futura."
                  : "Confirme o início dos envios oficiais pela Meta."}
          </p>
          {modal === "schedule" && (
            <label className="block text-sm font-medium text-slate-700">
              Data e hora do agendamento
              <input
                autoFocus
                aria-label="Data do agendamento"
                type="datetime-local"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </label>
          )}{" "}
          {modal === "cancel" && (
            <label className="block text-sm font-medium text-slate-700">
              Motivo do cancelamento
              <textarea
                autoFocus
                aria-label="Motivo do cancelamento"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                maxLength={500}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </label>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModal(null)}>
              Voltar
            </Button>
            <Button
              loading={actionLoading}
              variant={modal === "cancel" ? "danger" : "success"}
              onClick={() =>
                modal === "start"
                  ? void operate("start").then(() => setModal(null))
                  : modal === "pause"
                    ? void operate("pause").then(() => setModal(null))
                    : modal === "schedule"
                      ? void scheduleCampaign()
                      : void cancelCampaign()
              }
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
