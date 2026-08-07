"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Search } from "lucide-react";
import { analyticsService } from "@/services/analytics.service";
import { AnalyticsEvent } from "@/types/analytics";
import {
  AnalyticsCard,
  AnalyticsHeader,
  DateRange,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/analytics/AnalyticsUi";
const eventTypes = [
  "WEBHOOK_RECEIVED",
  "MESSAGE_RETRY",
  "MESSAGE_FAILED",
  "SCHEDULER_EXECUTED",
  "RECONCILIATION_EXECUTED",
  "MESSAGE_CLICKED",
  "MESSAGE_READ",
  "MESSAGE_DELIVERED",
  "DEAL_WON",
];
export default function EventsPage() {
  const [items, setItems] = useState<AnalyticsEvent[]>([]),
    [page, setPage] = useState(1),
    [pages, setPages] = useState(1),
    [search, setSearch] = useState(""),
    [type, setType] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [descending, setDescending] = useState(true),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await analyticsService.events({
        page,
        limit: 25,
        from: from || undefined,
        to: to || undefined,
      });
      setItems(data.items);
      setPages(data.pagination.pages || 1);
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Erro ao carregar eventos.",
      );
    } finally {
      setLoading(false);
    }
  }, [from, page, to]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  const visible = useMemo(
    () =>
      items
        .filter(
          (item) =>
            (!type || item.eventType === type) &&
            (!search ||
              `${item.eventType} ${item.source} ${item.campaignId ?? ""}`
                .toLowerCase()
                .includes(search.toLowerCase())),
        )
        .sort(
          (a, b) =>
            (new Date(a.occurredAt).getTime() -
              new Date(b.occurredAt).getTime()) *
            (descending ? -1 : 1),
        ),
    [descending, items, search, type],
  );
  return (
    <main className="space-y-6">
      <AnalyticsHeader
        eyebrow="Auditoria operacional"
        title="Eventos"
        description="Consulte webhooks, retries, erros, scheduler, reconciliation e a jornada comercial completa."
      />
      {error && <ErrorState message={error} />}
      <AnalyticsCard>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
            <Search size={16} />
            <input
              aria-label="Pesquisar eventos"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar"
              className="w-full py-2.5 outline-none"
            />
          </label>
          <select
            aria-label="Tipo do evento"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="rounded-xl border border-slate-200 px-3"
          >
            <option value="">Todos os tipos</option>
            {eventTypes.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <DateRange
            from={from}
            to={to}
            onChange={(field, value) => {
              setPage(1);
              if (field === "from") setFrom(value);
              else setTo(value);
            }}
          />
          <button
            onClick={() => setDescending((value) => !value)}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold"
          >
            <ArrowDownUp size={16} />
            {descending ? "Mais recentes" : "Mais antigos"}
          </button>
        </div>
      </AnalyticsCard>
      {loading ? (
        <LoadingState />
      ) : (
        <AnalyticsCard>
          {visible.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase text-slate-400">
                  <tr>
                    <th className="pb-3">Data</th>
                    <th>Tipo</th>
                    <th>Origem</th>
                    <th>Campanha</th>
                    <th>Lead</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-4">
                        {new Date(item.occurredAt).toLocaleString("pt-BR")}
                      </td>
                      <td className="font-semibold text-slate-900">
                        {item.eventType}
                      </td>
                      <td>{item.source}</td>
                      <td>{item.campaignId ?? "—"}</td>
                      <td>{item.leadId ?? "—"}</td>
                      <td>
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                          Auditável
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="Nenhum evento encontrado." />
          )}
          <footer className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
            <button
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Anterior
            </button>
            <span>
              Página {page} de {pages}
            </span>
            <button
              disabled={page >= pages}
              onClick={() => setPage((value) => value + 1)}
            >
              Próxima
            </button>
          </footer>
        </AnalyticsCard>
      )}
    </main>
  );
}
