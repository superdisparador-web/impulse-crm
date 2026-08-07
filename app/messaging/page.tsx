"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
  X,
} from "lucide-react";

import Badge, { type BadgeVariant } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import Select from "@/components/ui/Select";
import StatCard from "@/components/ui/StatCard";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableMessage,
  TableRow,
} from "@/components/ui/Table";
import { messagingService } from "@/services/messaging.service";
import {
  MessageQueue,
  MessageQueueFilters,
  QueueStatus,
} from "@/types/message-queue";

const statuses: QueueStatus[] = [
  "PENDING",
  "WAITING",
  "PROCESSING",
  "SENT",
  "FAILED",
  "RETRYING",
  "CANCELED",
];

const statusLabel: Record<QueueStatus, string> = {
  PENDING: "Pendente",
  WAITING: "Pausado",
  PROCESSING: "Processando",
  SENT: "Enviado",
  FAILED: "Falhou",
  RETRYING: "Nova tentativa",
  CANCELED: "Cancelado",
};

const statusVariant: Record<QueueStatus, BadgeVariant> = {
  PENDING: "warning",
  WAITING: "neutral",
  PROCESSING: "info",
  SENT: "success",
  FAILED: "danger",
  RETRYING: "purple",
  CANCELED: "neutral",
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("pt-BR");
}

type QueueMessageDetails = {
  externalMessageId?: string | null;
  status?: string | null;
  senderPhone?: string | null;
  recipientPhone?: string | null;
  templateName?: string | null;
  templateLanguage?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  failedAt?: string | null;
};

type QueueDetails = MessageQueue & {
  attempt?: number;
  maxAttempts?: number;
  lastError?: string | null;
  payload?: Record<string, unknown> | null;
  message?: QueueMessageDetails | null;
};

type Diagnosis = {
  type: "success" | "warning" | "danger" | "info";
  title: string;
  description: string;
};

function diagnoseQueue(queue: QueueDetails): Diagnosis {
  const rawError = [
    queue.lastError,
    queue.message?.errorMessage,
    queue.message?.errorCode,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    rawError.includes("132015") ||
    rawError.includes("paused due to low quality") ||
    rawError.includes("template is temporarily unavailable")
  ) {
    return {
      type: "danger",
      title: "Template pausado pela Meta",
      description:
        "Este modelo de mensagem foi suspenso pela Meta. Escolha outro template aprovado antes de realizar um novo disparo.",
    };
  }

  if (
    rawError.includes("132012") ||
    rawError.includes("parameter format does not match")
  ) {
    return {
      type: "danger",
      title: "Template incompatível com o conteúdo enviado",
      description:
        "A imagem ou os campos utilizados não correspondem ao formato aprovado do template.",
    };
  }

  if (
    rawError.includes("token") ||
    rawError.includes("oauth") ||
    rawError.includes("session has expired") ||
    rawError.includes("invalid access")
  ) {
    return {
      type: "danger",
      title: "Acesso à conta expirado",
      description:
        "A conexão com a conta do WhatsApp precisa ser renovada antes de realizar novos disparos.",
    };
  }

  if (
    rawError.includes("business account") ||
    rawError.includes("waba") ||
    rawError.includes("business manager") ||
    rawError.includes("business verification")
  ) {
    return {
      type: "danger",
      title: "Conta da Meta com problema",
      description:
        "A conta comercial possui uma restrição ou configuração pendente. Revise a conta no Gerenciador da Meta.",
    };
  }

  if (
    rawError.includes("blocked") ||
    rawError.includes("restricted") ||
    rawError.includes("disabled") ||
    rawError.includes("locked")
  ) {
    return {
      type: "danger",
      title: "BM bloqueada ou restrita",
      description:
        "A Meta restringiu a conta comercial, o número ou algum recurso utilizado neste envio.",
    };
  }

  if (
    rawError.includes("phone number") ||
    rawError.includes("number is not registered") ||
    rawError.includes("recipient") ||
    rawError.includes("undeliverable")
  ) {
    return {
      type: "danger",
      title: "Número não pôde receber a mensagem",
      description:
        "Confirme se o telefone está correto, possui WhatsApp ativo e pode receber mensagens.",
    };
  }

  if (
    queue.status === "FAILED" ||
    queue.message?.failedAt ||
    rawError
  ) {
    return {
      type: "danger",
      title: "Erro da Meta",
      description:
        "O envio não foi concluído. A Meta recusou ou interrompeu o processamento da mensagem.",
    };
  }

  if (queue.message?.readAt) {
    return {
      type: "success",
      title: "Mensagem lida",
      description:
        "O destinatário recebeu e abriu a mensagem.",
    };
  }

  if (queue.message?.deliveredAt) {
    return {
      type: "success",
      title: "Mensagem entregue",
      description:
        "A mensagem chegou ao WhatsApp do destinatário.",
    };
  }

  if (
    queue.status === "SENT" &&
    queue.message?.externalMessageId
  ) {
    return {
      type: "info",
      title: "Mensagem aceita, aguardando confirmação de entrega",
      description:
        "A Meta aceitou o envio. Ainda não recebemos a confirmação de que a mensagem chegou ao destinatário.",
    };
  }

  if (
    queue.status === "PROCESSING" ||
    queue.status === "RETRYING"
  ) {
    return {
      type: "warning",
      title: "Mensagem em processamento",
      description:
        "O sistema ainda está tentando realizar este envio.",
    };
  }

  return {
    type: "warning",
    title: "Mensagem aguardando envio",
    description:
      "A mensagem está na fila e ainda não foi processada.",
  };
}

function diagnosisClasses(type: Diagnosis["type"]) {
  if (type === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (type === "danger") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (type === "info") {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

export default function MessagingPage() {
  const router = useRouter();
  const [queues, setQueues] = useState<MessageQueue[]>([]);
  const [summary, setSummary] = useState<Partial<Record<QueueStatus, number>>>(
    {},
  );
  const [filters, setFilters] = useState<MessageQueueFilters>({
    page: 1,
    limit: 10,
  });
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedQueue, setSelectedQueue] =
    useState<QueueDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const queueData = await messagingService.getQueues(filters);
      setQueues(queueData.items);
      setSummary(queueData.summary);
      setMeta(queueData.meta);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar os disparos.",
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [load]);

  async function openDetails(queueId: string) {
    setLoadingDetails(true);
    setDetailsError("");

    try {
      const details = await messagingService.getQueue(queueId);
      setSelectedQueue(details as QueueDetails);
    } catch (detailsLoadError) {
      setDetailsError(
        detailsLoadError instanceof Error
          ? detailsLoadError.message
          : "Não foi possível carregar os detalhes do disparo.",
      );
    } finally {
      setLoadingDetails(false);
    }
  }

  function closeDetails() {
    setSelectedQueue(null);
    setDetailsError("");
  }

  const cards = [
    {
      title: "Total de disparos",
      value: meta.total,
      icon: <MessageSquareText className="h-5 w-5" />,
    },
    {
      title: "Em processamento",
      value: summary.PROCESSING ?? 0,
      icon: <Clock3 className="h-5 w-5" />,
    },
    {
      title: "Enviados",
      value: summary.SENT ?? 0,
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    {
      title: "Falhas",
      value: summary.FAILED ?? 0,
      icon: <AlertCircle className="h-5 w-5" />,
    },
  ];

  return (
    <main className="space-y-6 text-slate-900">
      <PageHeader
        title="Disparos"
        description="Gerencie os envios realizados pela API Oficial do WhatsApp Business Platform."
        action={
          <Button loading={loading} onClick={() => void load()}>
            <RefreshCw className="h-5 w-5" />
            Atualizar
          </Button>
        }
      />

      {error && (
        <Card
          role="alert"
          padding="sm"
          className="flex items-center gap-3 border-red-200 bg-red-50 text-sm text-red-700"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </Card>
      )}

      <section
        aria-label="Indicadores dos disparos"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {cards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </section>

      <Card padding="md" className="space-y-4">
        <div className="grid items-center gap-3 lg:grid-cols-[minmax(260px,1fr)_minmax(210px,0.45fr)_auto]">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400"
            />
            <Input
              aria-label="Buscar disparos"
              className="min-h-12 bg-white pl-11"
              placeholder="Buscar por campanha ou destinatário"
              value={filters.search ?? ""}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  page: 1,
                  search: event.target.value,
                }))
              }
            />
          </div>
          <Select
            aria-label="Filtrar por status"
            className="min-h-12 bg-white"
            value={filters.status ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                status: event.target.value as QueueStatus | "",
              }))
            }
            options={[
              { value: "", label: "Todos os status" },
              ...statuses.map((status) => ({
                value: status,
                label: statusLabel[status],
              })),
            ]}
          />
          <Button
            variant="secondary"
            size="lg"
            loading={loading}
            onClick={() => void load()}
          >
            <RefreshCw className="h-5 w-5" />
            Atualizar
          </Button>
        </div>
      </Card>

      <TableContainer>
        <Table className="min-w-[860px]">
          <TableHeader>
            <TableRow>
              <TableHead>Campanha</TableHead>
              <TableHead>Destinatário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data de envio</TableHead>
              <TableHead>Última atualização</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableMessage
                colSpan={6}
                title="Carregando disparos..."
                description="Aguarde enquanto atualizamos os envios."
              />
            ) : queues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-5">
                  <EmptyState
                    title="Nenhum disparo encontrado."
                    description="Quando campanhas forem enviadas elas aparecerão aqui."
                    icon={<Send className="h-6 w-6" />}
                    action={
                      <Button onClick={() => router.push("/campaigns")}>
                        Nova campanha
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              queues.map((queue) => (
                <TableRow key={queue.id}>
                  <TableCell className="font-semibold text-slate-900">
                    {queue.campaign?.name ?? queue.campaignId}
                  </TableCell>
                  <TableCell>
                    {queue.recipient?.name ?? queue.recipient?.phone ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[queue.status]}>
                      {statusLabel[queue.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(queue.finishedAt ?? queue.scheduledAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(queue.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void openDetails(queue.id)}
                    >
                      <Eye className="h-4 w-4" />
                      Ver detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <footer className="grid grid-cols-3 items-center border-t border-slate-200 px-5 py-4 text-sm text-slate-600">
          <Button
            variant="ghost"
            size="sm"
            className="justify-self-start"
            disabled={meta.page <= 1}
            onClick={() =>
              setFilters((current) => ({
                ...current,
                page: Math.max(1, (current.page ?? 1) - 1),
              }))
            }
          >
            Anterior
          </Button>
          <span className="justify-self-center">
            Página {meta.page} de {meta.totalPages || 1}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="justify-self-end"
            disabled={meta.page >= meta.totalPages}
            onClick={() =>
              setFilters((current) => ({
                ...current,
                page: (current.page ?? 1) + 1,
              }))
            }
          >
            Próxima
          </Button>
        </footer>
      </TableContainer>

      {(selectedQueue || detailsError || loadingDetails) && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Detalhes do disparo"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetails();
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Detalhes do disparo
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Veja o que aconteceu com esta mensagem.
                </p>
              </div>

              <button
                type="button"
                aria-label="Fechar"
                className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100"
                onClick={closeDetails}
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            {loadingDetails ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Carregando detalhes...
              </div>
            ) : detailsError ? (
              <div className="p-6">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
                  <p className="font-bold">
                    Não foi possível carregar os detalhes
                  </p>
                  <p className="mt-2 text-sm">{detailsError}</p>
                </div>
              </div>
            ) : selectedQueue ? (
              <div className="space-y-6 p-6">
                {(() => {
                  const diagnosis = diagnoseQueue(selectedQueue);
                  const message = selectedQueue.message;
                  const payload =
                    selectedQueue.payload &&
                    typeof selectedQueue.payload === "object"
                      ? selectedQueue.payload
                      : {};

                  const destination =
                    message?.recipientPhone ||
                    selectedQueue.recipient?.phone ||
                    String(payload.to ?? "—");

                  const template =
                    message?.templateName ||
                    String(payload.templateName ?? "—");

                  return (
                    <>
                      <section
                        className={`rounded-2xl border p-5 ${diagnosisClasses(
                          diagnosis.type,
                        )}`}
                      >
                        <div className="flex items-start gap-3">
                          {diagnosis.type === "success" ? (
                            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0" />
                          ) : diagnosis.type === "danger" ? (
                            <AlertCircle className="mt-0.5 h-6 w-6 shrink-0" />
                          ) : (
                            <Clock3 className="mt-0.5 h-6 w-6 shrink-0" />
                          )}

                          <div>
                            <h3 className="font-bold">
                              {diagnosis.title}
                            </h3>
                            <p className="mt-1 text-sm leading-6">
                              {diagnosis.description}
                            </p>
                          </div>
                        </div>
                      </section>

                      <section>
                        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                          Informações
                        </h3>

                        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                          {[
                            [
                              "Campanha",
                              selectedQueue.campaign?.name ||
                                selectedQueue.campaignId,
                            ],
                            ["Destinatário", destination],
                            ["Template", template],
                            [
                              "Status",
                              statusLabel[selectedQueue.status] ||
                                selectedQueue.status,
                            ],
                            [
                              "Tentativas",
                              `${selectedQueue.attempt ?? 0} de ${
                                selectedQueue.maxAttempts ?? 0
                              }`,
                            ],
                            [
                              "Última atualização",
                              formatDate(selectedQueue.updatedAt),
                            ],
                          ].map(([label, value]) => (
                            <div
                              key={label}
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                            >
                              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {label}
                              </dt>
                              <dd className="mt-2 break-words text-sm font-semibold text-slate-900">
                                {value || "—"}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </section>

                      <section>
                        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                          Acompanhamento
                        </h3>

                        <div className="mt-3 space-y-3 rounded-2xl border border-slate-200 p-5">
                          {[
                            [
                              "Aceita para envio",
                              message?.sentAt || selectedQueue.finishedAt,
                            ],
                            ["Entregue", message?.deliveredAt],
                            ["Lida", message?.readAt],
                            ["Falhou", message?.failedAt],
                          ].map(([label, date]) => (
                            <div
                              key={label}
                              className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                            >
                              <span className="text-sm text-slate-600">
                                {label}
                              </span>
                              <span className="text-right text-sm font-semibold text-slate-900">
                                {formatDate(date)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </section>

                      {(selectedQueue.lastError ||
                        message?.errorMessage) && (
                        <section>
                          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                            Informação recebida da Meta
                          </h3>

                          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                            <p className="text-sm leading-6 text-slate-700">
                              {message?.errorMessage ||
                                selectedQueue.lastError}
                            </p>
                          </div>
                        </section>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </main>
  );
}
