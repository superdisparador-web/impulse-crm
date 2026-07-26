"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DropTarget } from "@/components/pipeline/KanbanBoard";
import { PipelineBody } from "@/components/pipeline/PipelineBody";
import { LeadDrawer } from "@/components/leads/LeadDrawer";
import { PipelineHeader } from "@/components/pipeline/PipelineHeader";
import { PipelineFilters } from "@/components/pipeline/PipelineFilters";
import { PipelineMetrics } from "@/components/pipeline/PipelineMetrics";
import { findCardStage, getErrorMessage, isLatestBoardResponse, moveCard, selectInitialPipelineId, sortBoard } from "@/components/pipeline/pipeline-utils";
import { getPipelineBoard, listPipelines, movePipelineCard } from "@/services/pipeline-board.service";
import { PipelineBoard, PipelineFilters as Filters, PipelineSummary } from "@/types/pipeline-board";

export function startPipelinePolling(refresh: () => void, visibility: () => DocumentVisibilityState, timers: Pick<typeof window, "setInterval" | "clearInterval">, delay = 30_000) {
  const intervalId = timers.setInterval(() => { if (visibility() === "visible") refresh(); }, delay);
  return () => timers.clearInterval(intervalId);
}

export async function persistOptimisticPipelineMove(board: PipelineBoard, target: DropTarget, persist: (cardId: string, stageId: string, position: number) => Promise<unknown>, update: (board: PipelineBoard) => void, reportError: (message: string) => void) {
  const sourceStage = findCardStage(board, target.cardId);
  const nextBoard = moveCard(board, { cardId: target.cardId, destinationStageId: target.stageId, destinationIndex: target.index });
  const movedCard = nextBoard.stages.find((stage) => stage.id === target.stageId)?.cards.find((card) => card.id === target.cardId);
  if (!sourceStage || !movedCard) return false;
  const previousPosition = sourceStage.cards.find((card) => card.id === target.cardId)?.position;
  if (sourceStage.id === target.stageId && movedCard.position === previousPosition) return false;
  update(nextBoard);
  try { await persist(target.cardId, target.stageId, movedCard.position); return true; }
  catch (error) { update(board); reportError(error instanceof Error && error.message ? error.message : "Não foi possível movimentar o card. A alteração foi desfeita."); return false; }
}

export default function PipelinePage() {
  const [pipelines, setPipelines] = useState<PipelineSummary[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState("");
  const [board, setBoard] = useState<PipelineBoard | null>(null);
  const [loadingPipelines, setLoadingPipelines] = useState(true);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [movingCardId, setMovingCardId] = useState("");
  const [activeCardId, setActiveCardId] = useState("");
  const [error, setError] = useState("");
  const [moveError, setMoveError] = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");
  const boardRequestRef = useRef(0);
  const [filters, setFilters] = useState<Filters>({ sla: "ALL", limit: 50 });
  const [appliedFilters, setAppliedFilters] = useState<Filters>({ sla: "ALL", limit: 50 });

  const loadBoard = useCallback(async (pipelineId: string, refresh = false) => {
    const requestId = boardRequestRef.current + 1;
    boardRequestRef.current = requestId;
    setLoadingBoard(!refresh);
    setRefreshing(refresh);
    setError("");
    try {
      const data = sortBoard(await getPipelineBoard(pipelineId, appliedFilters));
      if (isLatestBoardResponse(boardRequestRef.current, requestId)) setBoard(data);
    } catch (err) {
      if (isLatestBoardResponse(boardRequestRef.current, requestId)) {
        setBoard(null);
        setError(getErrorMessage(err));
      }
    } finally {
      if (isLatestBoardResponse(boardRequestRef.current, requestId)) {
        setLoadingBoard(false);
        setRefreshing(false);
      }
    }
  }, [appliedFilters]);

  const loadPipelines = useCallback(async () => {
    setLoadingPipelines(true);
    setError("");
    try {
      const data = await listPipelines();
      setPipelines(data);
      const nextPipelineId = selectInitialPipelineId(data);
      setSelectedPipelineId(nextPipelineId);
      if (nextPipelineId) await loadBoard(nextPipelineId);
      else setBoard(null);
    } catch (err) {
      setPipelines([]);
      setBoard(null);
      setError(getErrorMessage(err));
    } finally {
      setLoadingPipelines(false);
    }
  }, [loadBoard]);

  useEffect(() => { const timeoutId = window.setTimeout(() => { void loadPipelines(); }, 0); return () => window.clearTimeout(timeoutId); }, [loadPipelines]);
  useEffect(() => {
    if (!selectedPipelineId) return;
    return startPipelinePolling(() => { void loadBoard(selectedPipelineId, true); }, () => document.visibilityState, window);
  }, [loadBoard, selectedPipelineId]);

  async function selectPipeline(pipelineId: string) {
    setSelectedPipelineId(pipelineId);
    setBoard(null);
    if (pipelineId) await loadBoard(pipelineId);
  }

  async function handleMove(target: DropTarget) {
    if (!board || movingCardId || target.cardId === "") return;
    setMoveError("");
    setMovingCardId(target.cardId);
    try {
      await persistOptimisticPipelineMove(board, target, movePipelineCard, setBoard, setMoveError);
    } finally {
      setMovingCardId("");
      setActiveCardId("");
    }
  }

  const isLoading = loadingPipelines || loadingBoard;
  const selectedCard = board?.stages.flatMap((stage) => stage.cards.map((card) => ({ ...card, stageId: stage.id }))).find((card) => card.id === selectedCardId) ?? null;

  return <main className="space-y-6"><PipelineHeader pipelines={pipelines} selectedPipelineId={selectedPipelineId} loading={isLoading} refreshing={refreshing} onSelectPipeline={(pipelineId) => { void selectPipeline(pipelineId); }} onRefresh={() => { if (selectedPipelineId) void loadBoard(selectedPipelineId, true); }} /><PipelineFilters value={filters} onChange={setFilters} onApply={() => setAppliedFilters(filters)} onClear={() => { const clean: Filters = { sla: "ALL", limit: 50 }; setFilters(clean); setAppliedFilters(clean); }} /><PipelineMetrics metrics={board?.metrics} /><PipelineBody error={error} moveError={moveError} isLoading={isLoading} pipelineCount={pipelines.length} board={board} activeCardId={activeCardId} moving={Boolean(movingCardId)} onDragStart={setActiveCardId} onDropCard={(target) => { void handleMove(target); }} onOpenCard={setSelectedCardId} /><LeadDrawer card={selectedCard} board={board} onClose={() => setSelectedCardId("")} onArchived={() => { if (selectedPipelineId) void loadBoard(selectedPipelineId, true); }} /></main>;
}
