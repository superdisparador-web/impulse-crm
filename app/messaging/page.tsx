"use client";

import { useCallback, useEffect, useState } from "react";
import { messagingService } from "@/services/messaging.service";
import { MessageLog } from "@/types/message-log";
import { MessageQueue, MessageQueueFilters, QueueStatus } from "@/types/message-queue";

const statuses: QueueStatus[] = ["PENDING", "WAITING", "PROCESSING", "SENT", "FAILED", "RETRYING", "CANCELED"];
const statusLabel: Record<QueueStatus, string> = { PENDING: "Pendente", WAITING: "Pausada", PROCESSING: "Processando", SENT: "Concluída", FAILED: "Erro", RETRYING: "Retentando", CANCELED: "Cancelada" };

export default function MessagingPage() {
  const [queues, setQueues] = useState<MessageQueue[]>([]);
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [summary, setSummary] = useState<Partial<Record<QueueStatus, number>>>({});
  const [filters, setFilters] = useState<MessageQueueFilters>({ page: 1, limit: 10 });
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [queueData, logData] = await Promise.all([messagingService.getQueues(filters), messagingService.getLogs({ limit: 8 })]);
      setQueues(queueData.items); setSummary(queueData.summary); setMeta(queueData.meta); setLogs(logData.items);
    } catch (err) { setError(err instanceof Error ? err.message : "Erro ao carregar Engine de Disparo."); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { const timeoutId = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timeoutId); }, [load]);

  async function runAction(id: string, fn: (id: string) => Promise<unknown>) {
    setActionLoading(id); setError("");
    try { await fn(id); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Erro ao executar ação."); }
    finally { setActionLoading(null); }
  }

  const cards = [
    { label: "Filas em processamento", value: summary.PROCESSING ?? 0 },
    { label: "Filas pausadas", value: summary.WAITING ?? 0 },
    { label: "Filas concluídas", value: summary.SENT ?? 0 },
    { label: "Filas com erro", value: summary.FAILED ?? 0 },
    { label: "Mensagens pendentes", value: (summary.PENDING ?? 0) + (summary.RETRYING ?? 0) },
    { label: "Mensagens processadas", value: summary.SENT ?? 0 },
    { label: "Mensagens com falha", value: summary.FAILED ?? 0 },
    { label: "Total de mensagens", value: meta.total },
  ];

  return <main className="space-y-6">
    <div><h1 className="text-4xl font-bold">Engine de Disparo</h1><p className="mt-2 text-slate-400">Infraestrutura de filas, logs, retry e throttling preparada para integração futura com a API Oficial. Nenhuma mensagem real é enviada.</p></div>
    {error && <div className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-red-200">{error}</div>}
    <section className="grid gap-3 md:grid-cols-4">{cards.map((card) => <div key={card.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4"><p className="text-sm text-slate-400">{card.label}</p><strong className="mt-2 block text-3xl">{card.value}</strong></div>)}</section>
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <input className="rounded-lg border border-slate-700 bg-slate-950 p-3" placeholder="Buscar campanha ou erro" value={filters.search ?? ""} onChange={(event) => setFilters((current) => ({ ...current, page: 1, search: event.target.value }))} />
        <select className="rounded-lg border border-slate-700 bg-slate-950 p-3" value={filters.status ?? ""} onChange={(event) => setFilters((current) => ({ ...current, page: 1, status: event.target.value as QueueStatus | "" }))}><option value="">Todos os status</option>{statuses.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}</select>
        <select className="rounded-lg border border-slate-700 bg-slate-950 p-3" value={filters.priority ?? ""} onChange={(event) => setFilters((current) => ({ ...current, page: 1, priority: event.target.value as MessageQueueFilters["priority"] }))}><option value="">Todas as prioridades</option><option>LOW</option><option>NORMAL</option><option>HIGH</option><option>URGENT</option></select>
        <button className="rounded-lg bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-700" onClick={() => void load()}>Atualizar</button>
      </div>
      <div className="mt-4 overflow-x-auto">
        {loading ? <p className="p-6 text-center text-slate-400">Carregando filas...</p> : queues.length === 0 ? <p className="p-6 text-center text-slate-400">Nenhuma fila encontrada.</p> : <table className="w-full text-sm"><thead className="text-left text-slate-400"><tr><th className="p-3">Campanha</th><th className="p-3">Destinatário</th><th className="p-3">Status</th><th className="p-3">Prioridade</th><th className="p-3">Tentativas</th><th className="p-3">Agendada</th><th className="p-3">Ações</th></tr></thead><tbody>{queues.map((queue) => <tr key={queue.id} className="border-t border-slate-800"><td className="p-3">{queue.campaign?.name ?? queue.campaignId}</td><td className="p-3">{queue.recipient?.name ?? queue.recipient?.phone ?? "-"}</td><td className="p-3">{statusLabel[queue.status]}</td><td className="p-3">{queue.priority}</td><td className="p-3">{queue.attempt}/{queue.maxAttempts}</td><td className="p-3">{new Date(queue.scheduledAt).toLocaleString()}</td><td className="flex flex-wrap gap-2 p-3"><button disabled={actionLoading === queue.id} className="rounded bg-slate-800 px-3 py-1" onClick={() => void runAction(queue.id, messagingService.pauseQueue)}>Pausar</button><button disabled={actionLoading === queue.id} className="rounded bg-slate-800 px-3 py-1" onClick={() => void runAction(queue.id, messagingService.resumeQueue)}>Retomar</button><button disabled={actionLoading === queue.id} className="rounded bg-slate-800 px-3 py-1" onClick={() => void runAction(queue.id, messagingService.retryQueue)}>Retry</button><button disabled={actionLoading === queue.id} className="rounded bg-red-900 px-3 py-1" onClick={() => void runAction(queue.id, messagingService.cancelQueue)}>Cancelar</button></td></tr>)}</tbody></table>}
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-400"><span>Página {meta.page} de {meta.totalPages || 1}</span><div className="flex gap-2"><button className="rounded bg-slate-800 px-3 py-2 disabled:opacity-50" disabled={meta.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, (current.page ?? 1) - 1) }))}>Anterior</button><button className="rounded bg-slate-800 px-3 py-2 disabled:opacity-50" disabled={meta.page >= meta.totalPages} onClick={() => setFilters((current) => ({ ...current, page: (current.page ?? 1) + 1 }))}>Próxima</button></div></div>
    </section>
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-4"><h2 className="text-xl font-semibold">Logs recentes</h2><div className="mt-3 space-y-2">{logs.length === 0 ? <p className="text-slate-400">Nenhum log registrado.</p> : logs.map((log) => <div key={log.id} className="rounded-lg bg-slate-950 p-3"><div className="flex justify-between gap-3"><strong>{statusLabel[log.status]}</strong><span className="text-sm text-slate-500">{new Date(log.createdAt).toLocaleString()}</span></div><p className="mt-1 text-slate-300">{log.message}</p></div>)}</div></section>
  </main>;
}
