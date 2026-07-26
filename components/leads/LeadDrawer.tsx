"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Activity,
  Clock3,
  History,
  LayoutDashboard,
  NotebookPen,
} from "lucide-react";

import {
  archiveLead360,
  createLead360Activity,
  getLead360,
  updateLead360,
} from "@/services/lead-360.service";

import {
  Lead,
  LeadActivity,
  LeadActivityFormData,
} from "@/types/lead";

import { LeadNote } from "@/types/lead-360";

import {
  PipelineBoard,
  PipelineCard,
} from "@/types/pipeline-board";

import { LeadActivities } from "./LeadActivities";
import { LeadHeader } from "./LeadHeader";
import { LeadHistory } from "./LeadHistory";
import { LeadInfo } from "./LeadInfo";
import { LeadNotes } from "./LeadNotes";
import { LeadTimeline } from "./LeadTimeline";

import { buildPipelineHistory } from "./lead360-utils";

import {
  parseLeadNotes,
  serializeLeadNotes,
} from "./lead-notes.adapter";

import { mapLeadTimeline } from "./lead-timeline.adapter";

type LeadDrawerTab =
  | "summary"
  | "timeline"
  | "notes"
  | "activities"
  | "history";

interface LeadDrawerProps {
  card: PipelineCard | null;
  board: PipelineBoard | null;
  leadId?: string | null;
  onClose: () => void;
  onArchived: () => void;
  onEdit?: (lead: Lead) => void;
}

const tabs: Array<{
  id: LeadDrawerTab;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  {
    id: "summary",
    label: "Resumo",
    icon: LayoutDashboard,
  },
  {
    id: "timeline",
    label: "Timeline",
    icon: Clock3,
  },
  {
    id: "notes",
    label: "Notas",
    icon: NotebookPen,
  },
  {
    id: "activities",
    label: "Atividades",
    icon: Activity,
  },
  {
    id: "history",
    label: "Histórico",
    icon: History,
  },
];

export function LeadDrawer({
  card,
  board,
  leadId,
  onClose,
  onArchived,
  onEdit,
}: LeadDrawerProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>(
    []
  );

  const [activeTab, setActiveTab] =
    useState<LeadDrawerTab>("summary");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  const closingRef = useRef(false);

  const selectedLeadId = card?.lead.id ?? leadId;

  const requestClose = useCallback(() => {
    if (closingRef.current) {
      return;
    }

    closingRef.current = true;
    setIsClosing(true);

    window.setTimeout(() => {
      onClose();
    }, 180);
  }, [onClose]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      closingRef.current = false;
      setIsClosing(false);
      setActiveTab("summary");
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [selectedLeadId]);

  useEffect(() => {
    if (!selectedLeadId) {
      return;
    }

    let active = true;

    const timeoutId = window.setTimeout(() => {
      setLoading(true);
      setError("");

      void getLead360(selectedLeadId)
        .then((data) => {
          if (!active) {
            return;
          }

          setLead(data);
          setNotes(parseLeadNotes(data.notes));
          setActivities(data.activities ?? []);
        })
        .catch((err: unknown) => {
          if (!active) {
            return;
          }

          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar a ficha do lead."
          );
        })
        .finally(() => {
          if (active) {
            setLoading(false);
          }
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [selectedLeadId]);

  useEffect(() => {
    if (!selectedLeadId) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        requestClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [requestClose, selectedLeadId]);

  const timeline = useMemo(() => {
    if (!lead) {
      return [];
    }

    return mapLeadTimeline({
      lead,
      card: card ?? undefined,
      events: lead.events ?? [],
      activities,
      notes,
    });
  }, [lead, card, activities, notes]);

  const history = useMemo(() => {
    if (!board || !card) {
      return [];
    }

    return buildPipelineHistory(board, card);
  }, [board, card]);

  const nextAction =
    activities.find(
      (activity) => activity.status !== "COMPLETED"
    ) ?? null;

  async function persistNotes(nextNotes: LeadNote[]) {
    if (!lead) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated = await updateLead360(lead.id, {
        notes: serializeLeadNotes(nextNotes),
      });

      setLead(updated);
      setNotes(nextNotes);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar observações."
      );
    } finally {
      setSaving(false);
    }
  }

  async function createActivity(
    data: LeadActivityFormData
  ) {
    if (!lead) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const created = await createLead360Activity(
        lead.id,
        data
      );

      setActivities((current) =>
        [...current, created].sort(
          (a, b) =>
            new Date(a.dueAt).getTime() -
            new Date(b.dueAt).getTime()
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível criar atividade."
      );
    } finally {
      setSaving(false);
    }
  }

  async function archiveLead() {
    if (!lead) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await archiveLead360(lead.id);
      onArchived();
      requestClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível arquivar o lead."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!selectedLeadId) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-40"
      aria-label="Área da ficha do lead"
    >
      <button
        type="button"
        aria-label="Fechar ficha clicando fora"
        onClick={requestClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
      />

      <aside
        aria-label="Ficha completa do cliente"
        className={`absolute right-0 top-0 flex h-screen w-full max-w-3xl flex-col border-l border-slate-800 bg-slate-950 shadow-2xl transition-transform duration-200 ease-out ${
          isClosing
            ? "translate-x-full"
            : "translate-x-0"
        }`}
      >
        <LeadHeader
          card={card}
          lead={lead}
          archiving={saving}
          onArchive={() => void archiveLead()}
          onEdit={
            lead ? () => onEdit?.(lead) : undefined
          }
          onClose={requestClose}
        />

        <div className="border-b border-slate-800 px-5 py-3"><a href={`/leads/${selectedLeadId}?from=pipeline`} className="text-sm font-semibold text-blue-300 hover:text-blue-200">Abrir ficha comercial completa</a></div>

        <nav
          className="border-b border-slate-800 bg-slate-950 px-4"
          aria-label="Navegação da ficha do lead"
        >
          <div className="flex gap-1 overflow-x-auto py-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    selected
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5">
            {loading && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-300">
                Carregando ficha do lead...
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-900 bg-red-950/60 p-4 text-sm text-red-200"
              >
                {error}
              </div>
            )}

            {!loading && lead && (
              <>
                {activeTab === "summary" && (
                  <div className="space-y-5">
                    <LeadInfo lead={lead} />

                    <section className="rounded-2xl border border-blue-900/80 bg-gradient-to-br from-blue-950/70 to-slate-900 p-5 shadow-lg shadow-blue-950/20">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-blue-600/20 p-2 text-blue-300">
                          <Clock3 size={20} />
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                            Próxima ação
                          </p>

                          <p className="mt-1 font-semibold text-white">
                            {nextAction
                              ? nextAction.title
                              : "Aguardar documentação"}
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
                            {nextAction
                              ? new Date(
                                  nextAction.dueAt
                                ).toLocaleString("pt-BR")
                              : "Nenhuma atividade pendente cadastrada."}
                          </p>
                        </div>
                      </div>
                    </section>

                    <section className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Atividades
                        </p>

                        <p className="mt-2 text-2xl font-bold text-white">
                          {activities.length}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Observações
                        </p>

                        <p className="mt-2 text-2xl font-bold text-white">
                          {notes.length}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Eventos
                        </p>

                        <p className="mt-2 text-2xl font-bold text-white">
                          {timeline.length}
                        </p>
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === "timeline" && (
                  <LeadTimeline items={timeline} />
                )}

                {activeTab === "notes" && (
                  <LeadNotes
                    notes={notes}
                    saving={saving}
                    onChange={(nextNotes) =>
                      void persistNotes(nextNotes)
                    }
                  />
                )}

                {activeTab === "activities" && (
                  <LeadActivities
                    activities={activities}
                    responsibleUserId={
                      lead.assignedUserId
                    }
                    saving={saving}
                    onCreate={(data) =>
                      void createActivity(data)
                    }
                  />
                )}

                {activeTab === "history" && (
                  <LeadHistory stages={history} />
                )}
              </>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
