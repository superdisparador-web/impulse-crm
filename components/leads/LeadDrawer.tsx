"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { archiveLead360, createLead360Activity, getLead360, updateLead360 } from "@/services/lead-360.service";
import { Lead, LeadActivity, LeadActivityFormData } from "@/types/lead";
import { LeadNote } from "@/types/lead-360";
import { PipelineBoard, PipelineCard } from "@/types/pipeline-board";
import { LeadActivities } from "./LeadActivities";
import { LeadHeader } from "./LeadHeader";
import { LeadHistory } from "./LeadHistory";
import { LeadInfo } from "./LeadInfo";
import { LeadNotes } from "./LeadNotes";
import { LeadTimeline } from "./LeadTimeline";
import { buildPipelineHistory } from "./lead360-utils";
import { parseLeadNotes, serializeLeadNotes } from "./lead-notes.adapter";
import { mapLeadTimeline } from "./lead-timeline.adapter";

export function LeadDrawer({ card, board, leadId, onClose, onArchived, onEdit }: { card: PipelineCard | null; board: PipelineBoard | null; leadId?: string | null; onClose: () => void; onArchived: () => void; onEdit?: (lead: Lead) => void }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const closingRef = useRef(false);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setIsClosing(true);
    window.setTimeout(onClose, 180);
  }, [onClose]);

  useEffect(() => {
    if (!card && !leadId) return;
    let active = true;
    const timeoutId = window.setTimeout(() => {
      setLoading(true); setError("");
      void getLead360(card?.lead.id ?? leadId!).then((data) => {
        if (!active) return;
        setLead(data); setNotes(parseLeadNotes(data.notes)); setActivities(data.activities ?? []);
      }).catch((err: unknown) => active && setError(err instanceof Error ? err.message : "Não foi possível carregar a ficha do lead.")).finally(() => active && setLoading(false));
    }, 0);
    return () => { active = false; window.clearTimeout(timeoutId); };
  }, [card, leadId]);

  const timeline = useMemo(() => lead ? mapLeadTimeline({ lead, card: card ?? undefined, events: lead.events ?? [], activities, notes }) : [], [lead, card, activities, notes]);
  const history = useMemo(() => board && card ? buildPipelineHistory(board, card) : [], [board, card]);
  const nextAction = activities.find((activity) => activity.status !== "COMPLETED") ?? null;

  async function persistNotes(nextNotes: LeadNote[]) {
    if (!lead) return;
    setSaving(true); setError("");
    try { const updated = await updateLead360(lead.id, { notes: serializeLeadNotes(nextNotes) }); setLead(updated); setNotes(nextNotes); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível salvar observações."); }
    finally { setSaving(false); }
  }
  async function createActivity(data: LeadActivityFormData) {
    if (!lead) return;
    setSaving(true); setError("");
    try { const created = await createLead360Activity(lead.id, data); setActivities((current) => [...current, created].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível criar atividade."); }
    finally { setSaving(false); }
  }
  async function archiveLead() {
    if (!lead) return;
    setSaving(true); setError("");
    try { await archiveLead360(lead.id); onArchived(); requestClose(); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível arquivar o lead."); }
    finally { setSaving(false); }
  }

  useEffect(() => {
    if (!card && !leadId) return;
    function onKeyDown(event: KeyboardEvent) { if (event.key === "Escape") requestClose(); }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [card, leadId, requestClose]);

  if (!card && !leadId) return null;
  return <div className="fixed inset-0 z-40" aria-label="Área da ficha do lead"><button aria-label="Fechar ficha clicando fora" onClick={requestClose} className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${isClosing ? "opacity-0" : "opacity-100"}`} /><aside aria-label="Ficha completa do cliente" className={`absolute right-0 top-0 h-screen w-full max-w-2xl overflow-y-auto border-l border-slate-800 bg-slate-950 shadow-2xl transition-transform duration-200 ease-out ${isClosing ? "translate-x-full" : "translate-x-0"}`}><LeadHeader card={card} lead={lead} archiving={saving} onArchive={() => void archiveLead()} onEdit={lead ? () => onEdit?.(lead) : undefined} onClose={requestClose} /><div className="space-y-6 p-5">{loading && <p className="text-slate-300">Carregando ficha do lead...</p>}{error && <p className="rounded-xl border border-red-900 bg-red-950/60 p-3 text-sm text-red-200">{error}</p>}{lead && <><LeadInfo lead={lead} /><section className="rounded-xl border border-blue-900 bg-blue-950/40 p-4"><h3 className="font-semibold text-white">Próxima ação</h3><p className="mt-1 text-slate-200">{nextAction ? `${nextAction.title} em ${new Date(nextAction.dueAt).toLocaleString("pt-BR")}` : "📄 Aguardar documentação"}</p></section><LeadTimeline items={timeline} /><LeadNotes notes={notes} saving={saving} onChange={(next) => void persistNotes(next)} /><LeadHistory stages={history} /><LeadActivities activities={activities} responsibleUserId={lead.assignedUserId} saving={saving} onCreate={(data) => void createActivity(data)} /></>}</div></aside></div>;
}
