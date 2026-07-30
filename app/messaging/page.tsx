"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
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

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

export default function MessagingPage() {
  const router = useRouter();
  const [queues, setQueues] = useState<MessageQueue[]>([]);
  const [summary, setSummary] = useState<
    Partial<Record<QueueStatus, number>>
  >({});
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
                  <TableCell className="text-slate-400">
                    —
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
    </main>
  );
}
