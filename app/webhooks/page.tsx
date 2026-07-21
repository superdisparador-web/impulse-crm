"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Inbox, RefreshCw, ShieldCheck } from "lucide-react";
import { webhookService } from "@/services/webhook.service";
import { WebhookEventStatus, WebhookOverview } from "@/types/webhook";

const statusClass: Record<WebhookEventStatus, string> = {
  RECEIVED: "bg-blue-900 text-blue-200",
  PROCESSED: "bg-green-900 text-green-200",
  FAILED: "bg-red-900 text-red-200",
  IGNORED: "bg-slate-800 text-slate-300",
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function EmptyState({ message }: { message: string }) {
  return <div className="p-8 text-center text-slate-400"><Inbox className="mx-auto mb-3 opacity-60" /><p>{message}</p></div>;
}

export default function WebhooksPage() {
  const [data, setData] = useState<WebhookOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [eventFilter, setEventFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<WebhookEventStatus | "">("");
  const limit = 10;

  const load = useCallback(async (nextPage = page) => {
    setRefreshing(Boolean(data));
    setLoading(!data);
    setError("");
    try {
      setData(await webhookService.getOverview({ page: nextPage, limit }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar webhooks. Tente novamente em instantes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [data, page]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void load(page); }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [load, page]);

  const totals = data?.totals ?? [];
  const events = useMemo(() => (data?.events ?? []).filter((event) => (!eventFilter || event.eventType === eventFilter) && (!statusFilter || event.status === statusFilter)), [data?.events, eventFilter, statusFilter]);
  const eventTypes = useMemo(() => [...new Set((data?.totals ?? []).map((item) => item.eventType))], [data?.totals]);
  const totalPages = Math.max(1, Math.ceil((data?.meta.totalEvents ?? 0) / limit));

  function changePage(nextPage: number) {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);
    setPage(safePage);
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Webhooks Meta</h1>
          <p className="mt-2 text-slate-400">Monitoramento da integração oficial do WhatsApp Business Platform.</p>
        </div>
        <button disabled={refreshing} onClick={() => void load(page)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"><RefreshCw className={refreshing ? "animate-spin" : ""} size={18} /> {refreshing ? "Atualizando" : "Atualizar"}</button>
      </div>

      {error && <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-red-200"><strong>Não foi possível carregar os webhooks.</strong><p className="mt-1 text-sm">{error}</p></div>}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"><ShieldCheck className="mb-3 text-green-300" /><p className="text-sm text-slate-400">Health check</p><p className="text-2xl font-bold">{loading ? "..." : data?.health.status === "ok" ? "Online" : "Indisponível"}</p></div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"><Inbox className="mb-3 text-blue-300" /><p className="text-sm text-slate-400">Eventos totais</p><p className="text-2xl font-bold">{data?.meta.totalEvents ?? 0}</p></div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"><AlertTriangle className="mb-3 text-amber-300" /><p className="text-sm text-slate-400">Erros totais</p><p className="text-2xl font-bold">{data?.meta.totalErrors ?? 0}</p></div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"><CheckCircle2 className="mb-3 text-purple-300" /><p className="text-sm text-slate-400">Mensagens inbound</p><p className="text-2xl font-bold">{data?.meta.totalInboundMessages ?? 0}</p></div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-xl font-semibold">Status da integração</h2><p className="mt-2 text-slate-400">Endpoint público: <span className="font-mono text-slate-200">GET/POST /webhooks/meta</span>. Administração protegida por JWT: <span className="font-mono text-slate-200">/webhooks</span> e <span className="font-mono text-slate-200">/webhooks/health</span>.</p></div>
          <p className="text-sm text-slate-500">Última atualização: {formatDate(data?.health.timestamp)}</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"><option value="">Todos os eventos</option>{eventTypes.map((eventType) => <option key={eventType} value={eventType}>{eventType}</option>)}</select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as WebhookEventStatus | "")} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"><option value="">Todos os status</option><option value="RECEIVED">Recebidos</option><option value="PROCESSED">Processados</option><option value="FAILED">Falhas</option><option value="IGNORED">Ignorados</option></select>
          {(eventFilter || statusFilter) && <button onClick={() => { setEventFilter(""); setStatusFilter(""); }} className="text-sm text-blue-300 hover:text-blue-200">Limpar filtros</button>}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60"><div className="border-b border-slate-800 p-5"><h2 className="text-xl font-semibold">Últimos webhooks</h2></div><div className="divide-y divide-slate-800">{loading ? <div className="p-8 text-slate-400">Carregando eventos...</div> : !events.length ? <EmptyState message="Nenhum evento encontrado para os filtros selecionados." /> : events.map((event) => <div key={event.id} className="p-5"><div className="flex justify-between gap-3"><strong>{event.eventType}</strong><span className="text-sm text-slate-400">{formatDate(event.createdAt)}</span></div><p className="mt-2 text-sm text-slate-400"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[event.status]}`}>{event.status}</span><span className="ml-2">Assinatura: {event.signatureValid === undefined || event.signatureValid === null ? "não enviada" : event.signatureValid ? "válida" : "inválida"}</span></p></div>)}</div></div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60"><div className="border-b border-slate-800 p-5"><h2 className="text-xl font-semibold">Últimas mensagens recebidas</h2></div><div className="divide-y divide-slate-800">{loading ? <div className="p-8 text-slate-400">Carregando mensagens...</div> : !data?.inboundMessages.length ? <EmptyState message="Nenhuma mensagem inbound recebida ainda." /> : data.inboundMessages.map((message) => <div key={message.id} className="p-5"><div className="flex justify-between gap-3"><strong>{message.customerName ?? message.from}</strong><span className="text-sm text-slate-400">{formatDate(message.receivedAt)}</span></div><p className="text-sm text-slate-400">{message.type}: {message.text ?? message.mediaFiles?.[0]?.fileName ?? message.metaMessageId}</p></div>)}</div></div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60"><div className="border-b border-slate-800 p-5"><h2 className="text-xl font-semibold">Últimos erros</h2></div><div className="divide-y divide-slate-800">{!data?.errors.length ? <EmptyState message="Nenhum erro recente registrado." /> : data.errors.map((event) => <div key={event.id} className="p-5"><strong>{event.eventType}</strong><p className="text-sm text-slate-400">{event.errorMessage ?? "Erro reportado no payload da Meta."}</p></div>)}</div></div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"><h2 className="text-xl font-semibold">Totais por evento</h2>{!totals.length ? <p className="mt-4 text-slate-400">Sem métricas de eventos.</p> : <div className="mt-4 flex flex-wrap gap-2">{totals.map((item) => <span key={item.eventType} className="rounded-full bg-slate-800 px-3 py-1 text-sm">{item.eventType}: {item.total}</span>)}</div>}</div>
      </section>

      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300"><span>Página {page} de {totalPages}</span><div className="flex gap-2"><button onClick={() => changePage(page - 1)} disabled={page <= 1 || loading} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"><ChevronLeft size={16} /> Anterior</button><button onClick={() => changePage(page + 1)} disabled={page >= totalPages || loading} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50">Próxima <ChevronRight size={16} /></button></div></div>
    </main>
  );
}
