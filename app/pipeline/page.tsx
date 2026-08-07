"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DropTarget } from "@/components/pipeline/KanbanBoard";
import { PipelineBody } from "@/components/pipeline/PipelineBody";
import { LeadDrawer } from "@/components/leads/LeadDrawer";
import { PipelineHeader } from "@/components/pipeline/PipelineHeader";
import { PipelineFilters } from "@/components/pipeline/PipelineFilters";
import { PipelineMetrics } from "@/components/pipeline/PipelineMetrics";
import { StageManager } from "@/components/pipeline/StageManager";
import {
  findCardStage,
  getErrorMessage,
  isLatestBoardResponse,
  moveCard,
  selectInitialPipelineId,
  sortBoard,
} from "@/components/pipeline/pipeline-utils";
import {
  createPipelineStage,
  deletePipelineStage,
  getPipelineBoard,
  listPipelines,
  movePipelineCard,
  reorderPipelineStages,
  updatePipelineStage,
} from "@/services/pipeline-board.service";
import {
  PipelineBoard,
  PipelineFilters as Filters,
  PipelineStage,
  PipelineSummary,
} from "@/types/pipeline-board";

export function startPipelinePolling(
  refresh: () => void,
  visibility: () => DocumentVisibilityState,
  timers: Pick<typeof window, "setInterval" | "clearInterval">,
  delay = 30_000,
) {
  const intervalId = timers.setInterval(() => {
    if (visibility() === "visible") refresh();
  }, delay);
  return () => timers.clearInterval(intervalId);
}

export async function persistOptimisticPipelineMove(
  board: PipelineBoard,
  target: DropTarget,
  persist: (
    cardId: string,
    stageId: string,
    position: number,
  ) => Promise<unknown>,
  update: (board: PipelineBoard) => void,
  reportError: (message: string) => void,
) {
  const sourceStage = findCardStage(board, target.cardId);
  const nextBoard = moveCard(board, {
    cardId: target.cardId,
    destinationStageId: target.stageId,
    destinationIndex: target.index,
  });
  const movedCard = nextBoard.stages
    .find((stage) => stage.id === target.stageId)
    ?.cards.find((card) => card.id === target.cardId);
  if (!sourceStage || !movedCard) return false;
  const previousPosition = sourceStage.cards.find(
    (card) => card.id === target.cardId,
  )?.position;
  if (
    sourceStage.id === target.stageId &&
    movedCard.position === previousPosition
  )
    return false;
  update(nextBoard);
  try {
    await persist(target.cardId, target.stageId, movedCard.position);
    return true;
  } catch (error) {
    update(board);
    reportError(
      error instanceof Error && error.message
        ? error.message
        : "Não foi possível movimentar o card. A alteração foi desfeita.",
    );
    return false;
  }
}

export default function PipelinePage() {
  const [pipelines, setPipelines] = useState<PipelineSummary[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState("");
  const [board, setBoard] = useState<PipelineBoard | null>(null);
  const [loadingPipelines, setLoadingPipelines] = useState(true);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [movingCardId, setMovingCardId] = useState("");
  const [savingStage, setSavingStage] = useState(false);
  const [activeCardId, setActiveCardId] = useState("");
  const [error, setError] = useState("");
  const [moveError, setMoveError] = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");
  const boardRequestRef = useRef(0);
  const [filters, setFilters] = useState<Filters>({ sla: "ALL", limit: 50 });
  const [appliedFilters, setAppliedFilters] = useState<Filters>({
    sla: "ALL",
    limit: 50,
  });

  const loadBoard = useCallback(
    async (pipelineId: string, refresh = false) => {
      const requestId = boardRequestRef.current + 1;
      boardRequestRef.current = requestId;
      setLoadingBoard(!refresh);
      setRefreshing(refresh);
      setError("");
      try {
        const data = sortBoard(
          await getPipelineBoard(pipelineId, appliedFilters),
        );
        if (isLatestBoardResponse(boardRequestRef.current, requestId))
          setBoard(data);
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
    },
    [appliedFilters],
  );

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

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPipelines();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadPipelines]);
  useEffect(() => {
    if (!selectedPipelineId) return;
    return startPipelinePolling(
      () => {
        void loadBoard(selectedPipelineId, true);
      },
      () => document.visibilityState,
      window,
    );
  }, [loadBoard, selectedPipelineId]);
  useEffect(() => {
    const timeoutId = window.setTimeout(
      () =>
        setAppliedFilters((current) =>
          current.search === filters.search
            ? current
            : { ...current, search: filters.search },
        ),
      300,
    );
    return () => window.clearTimeout(timeoutId);
  }, [filters.search]);

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
      await persistOptimisticPipelineMove(
        board,
        target,
        movePipelineCard,
        setBoard,
        setMoveError,
      );
    } finally {
      setMovingCardId("");
      setActiveCardId("");
    }
  }

  async function mutateStages(action: () => Promise<unknown>) {
    if (!selectedPipelineId || savingStage) return;
    setSavingStage(true);
    setMoveError("");
    try {
      await action();
      await loadBoard(selectedPipelineId, true);
    } catch (err) {
      setMoveError(getErrorMessage(err));
    } finally {
      setSavingStage(false);
    }
  }
  const createStage = (name: string, color: string) =>
    mutateStages(() =>
      createPipelineStage(selectedPipelineId, { name, color }),
    );
  const updateStage = (stage: PipelineStage, name: string, color: string) =>
    mutateStages(() =>
      updatePipelineStage(selectedPipelineId, stage.id, { name, color }),
    );
  const deleteStage = (stage: PipelineStage) =>
    mutateStages(() => deletePipelineStage(selectedPipelineId, stage.id));
  const reorderStages = (stages: PipelineStage[]) =>
    mutateStages(async () => {
      setBoard((current) =>
        current
          ? {
              ...current,
              stages: stages.map((stage, index) => ({
                ...stage,
                position: index + 1,
              })),
            }
          : current,
      );
      await reorderPipelineStages(selectedPipelineId, stages);
    });

  const filterSuggestions = useMemo(
    () => ({
      broker: [
        ...new Set(
          board?.stages.flatMap((stage) =>
            stage.cards
              .map((card) => card.lead.assignedUser?.name)
              .filter((name): name is string => Boolean(name)),
          ) ?? [],
        ),
      ],
      manager: [
        ...new Set(
          board?.stages.flatMap((stage) =>
            stage.cards
              .map((card) => card.lead.managerUser?.name)
              .filter((name): name is string => Boolean(name)),
          ) ?? [],
        ),
      ],
      campaign: [
        ...new Set(
          board?.stages.flatMap((stage) =>
            stage.cards
              .map((card) => card.lead.campaign)
              .filter((name): name is string => Boolean(name)),
          ) ?? [],
        ),
      ],
      product: [
        ...new Set(
          board?.stages.flatMap((stage) =>
            stage.cards
              .map((card) => card.lead.product ?? card.lead.development)
              .filter((name): name is string => Boolean(name)),
          ) ?? [],
        ),
      ],
    }),
    [board],
  );

  const isLoading = loadingPipelines || loadingBoard;
  const selectedCard = useMemo(
    () =>
      board?.stages
        .flatMap((stage) =>
          stage.cards.map((card) => ({ ...card, stageId: stage.id })),
        )
        .find((card) => card.id === selectedCardId) ?? null,
    [board, selectedCardId],
  );

  return (
    <main className="space-y-6">
      <PipelineHeader
        pipelines={pipelines}
        selectedPipelineId={selectedPipelineId}
        loading={isLoading}
        refreshing={refreshing}
        onSelectPipeline={(pipelineId) => {
          void selectPipeline(pipelineId);
        }}
        onRefresh={() => {
          if (selectedPipelineId) void loadBoard(selectedPipelineId, true);
        }}
      />
      <PipelineFilters
        value={filters}
        suggestions={filterSuggestions}
        onChange={setFilters}
        onApply={() => setAppliedFilters(filters)}
        onClear={() => {
          const clean: Filters = { sla: "ALL", limit: 50 };
          setFilters(clean);
          setAppliedFilters(clean);
        }}
      />
      <PipelineMetrics metrics={board?.metrics} stages={board?.stages} />
      <StageManager
        stages={board?.stages ?? []}
        saving={savingStage}
        error={moveError}
        onCreate={createStage}
        onUpdate={updateStage}
        onDelete={deleteStage}
        onReorder={reorderStages}
      />
      <PipelineBody
        error={error}
        moveError={moveError}
        isLoading={isLoading}
        pipelineCount={pipelines.length}
        board={board}
        activeCardId={activeCardId}
        moving={Boolean(movingCardId)}
        onDragStart={setActiveCardId}
        onDropCard={(target) => {
          void handleMove(target);
        }}
        onOpenCard={setSelectedCardId}
      />
      <LeadDrawer
        card={selectedCard}
        board={board}
        onClose={() => setSelectedCardId("")}
        onArchived={() => {
          if (selectedPipelineId) void loadBoard(selectedPipelineId, true);
        }}
      />
    </main>
  );
}
