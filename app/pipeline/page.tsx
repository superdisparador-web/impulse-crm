"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DropTarget } from "@/components/pipeline/KanbanBoard";
import { PipelineBody } from "@/components/pipeline/PipelineBody";
import { PipelineHeader } from "@/components/pipeline/PipelineHeader";
import { findCardStage, getErrorMessage, isLatestBoardResponse, moveCard, selectInitialPipelineId, sortBoard } from "@/components/pipeline/pipeline-utils";
import { getPipelineBoard, listPipelines, movePipelineCard } from "@/services/pipeline-board.service";
import { PipelineBoard, PipelineSummary } from "@/types/pipeline-board";

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
  const boardRequestRef = useRef(0);

  const loadBoard = useCallback(async (pipelineId: string, refresh = false) => {
    const requestId = boardRequestRef.current + 1;
    boardRequestRef.current = requestId;
    setLoadingBoard(!refresh);
    setRefreshing(refresh);
    setError("");
    try {
      const data = sortBoard(await getPipelineBoard(pipelineId));
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
  }, []);

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

  async function selectPipeline(pipelineId: string) {
    setSelectedPipelineId(pipelineId);
    setBoard(null);
    if (pipelineId) await loadBoard(pipelineId);
  }

  async function handleMove(target: DropTarget) {
    if (!board || movingCardId || target.cardId === "") return;
    const previousBoard = board;
    const sourceStage = findCardStage(previousBoard, target.cardId);
    const nextBoard = moveCard(previousBoard, { cardId: target.cardId, destinationStageId: target.stageId, destinationIndex: target.index });
    const destinationStage = nextBoard.stages.find((stage) => stage.id === target.stageId);
    const movedCard = destinationStage?.cards.find((card) => card.id === target.cardId);
    if (!sourceStage || !destinationStage || !movedCard) return;
    if (sourceStage.id === target.stageId && movedCard.position === previousBoard.stages.find((stage) => stage.id === sourceStage.id)?.cards.find((card) => card.id === target.cardId)?.position) return;

    setMoveError("");
    setMovingCardId(target.cardId);
    setBoard(nextBoard);
    try {
      await movePipelineCard(target.cardId, target.stageId, movedCard.position);
    } catch (err) {
      setBoard(previousBoard);
      setMoveError(err instanceof Error && err.message ? err.message : "Não foi possível movimentar o card. A alteração foi desfeita.");
    } finally {
      setMovingCardId("");
      setActiveCardId("");
    }
  }

  const isLoading = loadingPipelines || loadingBoard;

  return <main className="space-y-6"><PipelineHeader pipelines={pipelines} selectedPipelineId={selectedPipelineId} loading={isLoading} refreshing={refreshing} onSelectPipeline={(pipelineId) => { void selectPipeline(pipelineId); }} onRefresh={() => { if (selectedPipelineId) void loadBoard(selectedPipelineId, true); }} /><PipelineBody error={error} moveError={moveError} isLoading={isLoading} pipelineCount={pipelines.length} board={board} activeCardId={activeCardId} moving={Boolean(movingCardId)} onDragStart={setActiveCardId} onDropCard={(target) => { void handleMove(target); }} /></main>;
}
