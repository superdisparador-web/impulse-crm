"use client";

import { useCallback, useMemo, useRef, useState } from 'react';
import PipelineColumn from './PipelineColumn';
import { Lead } from '@/types/lead';
import { PipelineStage } from '@/types/pipeline';

interface DragState { leadId: string; originStageId: string | null; startX: number; startY: number; moved: boolean; }
interface PipelineBoardProps { stages: PipelineStage[]; leads: Lead[]; movingLeadId: string | null; onOpenLead: (lead: Lead) => void; onMoveLead: (leadId: string, stageId: string) => Promise<void>; }

function groupLeadsByStage(stages: PipelineStage[], leads: Lead[]) {
  const groups = Object.fromEntries(stages.map((stage) => [stage.id, [] as Lead[]]));
  for (const lead of leads) if (lead.stageId && groups[lead.stageId]) groups[lead.stageId].push(lead);
  return groups;
}

function getStageIdFromPoint(x: number, y: number) {
  const element = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-stage-id]');
  return element?.dataset.stageId ?? null;
}

export default function PipelineBoard({ stages, leads, movingLeadId, onOpenLead, onMoveLead }: PipelineBoardProps) {
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [activeDropStageId, setActiveDropStageId] = useState<string | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const leadsByStage = useMemo(() => groupLeadsByStage(stages, leads), [stages, leads]);

  const finishDrag = useCallback(async (clientX: number, clientY: number) => {
    const dragState = dragStateRef.current;
    dragStateRef.current = null;
    setDraggingLeadId(null);
    setActiveDropStageId(null);
    if (!dragState?.moved) return;
    const targetStageId = getStageIdFromPoint(clientX, clientY);
    if (targetStageId && targetStageId !== dragState.originStageId) await onMoveLead(dragState.leadId, targetStageId);
  }, [onMoveLead]);

  const handleCardPointerDown = useCallback((event: React.PointerEvent<HTMLElement>, lead: Lead) => {
    if (event.button !== 0) return;

    const controller = new AbortController();
    dragStateRef.current = { leadId: lead.id, originStageId: lead.stageId ?? null, startX: event.clientX, startY: event.clientY, moved: false };

    function handlePointerMove(pointerEvent: PointerEvent) {
      const dragState = dragStateRef.current;
      if (!dragState) return;
      const distance = Math.hypot(pointerEvent.clientX - dragState.startX, pointerEvent.clientY - dragState.startY);
      if (!dragState.moved && distance > 6) {
        dragState.moved = true;
        setDraggingLeadId(dragState.leadId);
      }
      if (dragState.moved) setActiveDropStageId(getStageIdFromPoint(pointerEvent.clientX, pointerEvent.clientY));
    }

    function handlePointerEnd(pointerEvent: PointerEvent) {
      controller.abort();
      void finishDrag(pointerEvent.clientX, pointerEvent.clientY);
    }

    window.addEventListener('pointermove', handlePointerMove, { signal: controller.signal });
    window.addEventListener('pointerup', handlePointerEnd, { signal: controller.signal });
    window.addEventListener('pointercancel', handlePointerEnd, { signal: controller.signal });
  }, [finishDrag]);

  if (stages.length === 0) return <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950 p-10 text-center text-slate-400">Nenhuma etapa ativa neste pipeline.</div>;

  return (
    <div aria-busy={movingLeadId ? 'true' : 'false'} className="relative">
      {movingLeadId && <div className="absolute right-2 top-2 z-10 rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">Salvando movimento...</div>}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => <PipelineColumn key={stage.id} stage={stage} leads={leadsByStage[stage.id] ?? []} activeDropStageId={activeDropStageId} draggingLeadId={draggingLeadId} onOpenLead={onOpenLead} onCardPointerDown={handleCardPointerDown} />)}
      </div>
    </div>
  );
}
