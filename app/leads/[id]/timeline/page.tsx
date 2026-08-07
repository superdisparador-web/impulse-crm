"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckCheck,
  CircleDollarSign,
  Clock3,
  Eye,
  MessageCircleReply,
  MousePointerClick,
  Send,
  Tag,
  TriangleAlert,
} from "lucide-react";
import { leadService } from "@/services/lead.service";
import { LeadTimelineEvent } from "@/types/analytics";
import {
  AnalyticsCard,
  AnalyticsHeader,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/analytics/AnalyticsUi";

const PAGE_SIZE = 20;
const visual: Record<
  string,
  { label: string; color: string; icon: typeof Send }
> = {
  SENT: { label: "Mensagem enviada", color: "bg-blue-600", icon: Send },
  DELIVERED: {
    label: "Mensagem entregue",
    color: "bg-cyan-600",
    icon: CheckCheck,
  },
  READ: { label: "Mensagem lida", color: "bg-violet-600", icon: Eye },
  CLICKED: {
    label: "Link acessado",
    color: "bg-indigo-600",
    icon: MousePointerClick,
  },
  FIRST_SERVICE: {
    label: "Corretor respondeu",
    color: "bg-emerald-600",
    icon: MessageCircleReply,
  },
  DEAL_WON: {
    label: "Venda concluída",
    color: "bg-green-600",
    icon: CircleDollarSign,
  },
  ERROR: {
    label: "Erro operacional",
    color: "bg-red-600",
    icon: TriangleAlert,
  },
};
export default function LeadTimelinePage() {
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<LeadTimelineEvent[]>([]),
    [source, setSource] = useState(""),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    leadService
      .getTimeline(id)
      .then((data) => active && setItems(data.items))
      .catch(
        (reason: unknown) =>
          active &&
          setError(
            reason instanceof Error
              ? reason.message
              : "Erro ao carregar timeline.",
          ),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);
  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (!source || item.source === source) &&
          (!search ||
            `${item.type} ${item.event?.description ?? ""} ${item.campaign?.name ?? ""}`
              .toLowerCase()
              .includes(search.toLowerCase())),
      ),
    [items, search, source],
  );
  const visible = filtered.slice(0, page * PAGE_SIZE);
  if (loading) return <LoadingState label="Montando timeline do lead..." />;
  return (
    <main className="space-y-6">
      <AnalyticsHeader
        eyebrow="Jornada 360º"
        title="Timeline do Lead"
        description="Histórico cronológico consolidado de campanhas, mensagens, atendimento e pipeline."
      />
      {error && <ErrorState message={error} />}
      <AnalyticsCard>
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
          <input
            aria-label="Pesquisar timeline"
            placeholder="Pesquisar evento, campanha ou descrição"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5"
          />
          <select
            aria-label="Filtrar origem"
            value={source}
            onChange={(event) => {
              setSource(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5"
          >
            <option value="">Todas as origens</option>
            {["CAMPAIGNS", "WHATSAPP", "LEADS", "PIPELINE"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
      </AnalyticsCard>
      <AnalyticsCard>
        {visible.length ? (
          <ol className="relative ml-5 border-l-2 border-slate-200">
            {visible.map((item) => {
              const style = visual[item.type] ?? {
                label:
                  item.event?.description || item.type.replaceAll("_", " "),
                color: "bg-slate-600",
                icon: Tag,
              };
              const Icon = style.icon;
              return (
                <li
                  key={item.id}
                  className="group relative pb-8 pl-9 last:pb-0"
                >
                  <span
                    className={`absolute -left-[18px] flex h-9 w-9 items-center justify-center rounded-full text-white shadow-md ring-4 ring-white ${style.color}`}
                  >
                    <Icon size={17} />
                  </span>
                  <article className="rounded-2xl border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-slate-900">{style.label}</strong>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500">
                        {item.source}
                      </span>
                    </div>
                    {item.campaign && (
                      <p className="mt-1 text-sm text-blue-700">
                        {item.campaign.name}
                      </p>
                    )}
                    <time className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                      <Clock3 size={13} />
                      {new Date(item.occurredAt).toLocaleString("pt-BR")}
                    </time>
                  </article>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState message="Nenhum evento encontrado com os filtros selecionados." />
        )}
        {visible.length < filtered.length && (
          <button
            onClick={() => setPage((value) => value + 1)}
            className="mx-auto mt-6 block rounded-xl border border-blue-200 px-5 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"
          >
            Carregar mais eventos
          </button>
        )}
      </AnalyticsCard>
    </main>
  );
}
