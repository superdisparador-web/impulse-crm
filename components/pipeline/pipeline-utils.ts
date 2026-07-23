import { PipelineBoard, PipelineCard, PipelineStage } from "@/types/pipeline-board";

export type MoveTarget = { cardId: string; destinationStageId: string; destinationIndex: number };

export function sortBoard(board: PipelineBoard): PipelineBoard {
  return {
    ...board,
    stages: [...board.stages]
      .sort((a, b) => a.position - b.position)
      .map((stage) => ({ ...stage, cards: sortCards(stage.cards) })),
  };
}

export function normalizeCards(cards: PipelineCard[]): PipelineCard[] {
  return cards.map((card, index) => ({ ...card, position: index + 1 }));
}

function sortCards(cards: PipelineCard[]): PipelineCard[] {
  return normalizeCards([...cards].sort((a, b) => a.position - b.position));
}

export function moveCard(board: PipelineBoard, target: MoveTarget): PipelineBoard {
  const sorted = sortBoard(board);
  let movingCard: PipelineCard | null = null;
  const stagesWithoutCard = sorted.stages.map((stage) => {
    const remaining = stage.cards.filter((card) => {
      if (card.id !== target.cardId) return true;
      movingCard = card;
      return false;
    });
    return { ...stage, cards: remaining };
  });

  if (!movingCard) return sorted;

  const nextStages = stagesWithoutCard.map((stage) => {
    if (stage.id !== target.destinationStageId) return { ...stage, cards: sortCards(stage.cards) };
    const insertAt = Math.max(0, Math.min(target.destinationIndex, stage.cards.length));
    const nextCards = [...stage.cards];
    nextCards.splice(insertAt, 0, movingCard as PipelineCard);
    return { ...stage, cards: normalizeCards(nextCards) };
  });

  return { ...sorted, stages: nextStages };
}

export function findCardStage(board: PipelineBoard, cardId: string): PipelineStage | undefined {
  return board.stages.find((stage) => stage.cards.some((card) => card.id === cardId));
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Não foi possível carregar o Pipeline.";
}

export function formatStageTime(value?: string | null, now = Date.now()): string | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp) || timestamp > now) return null;
  const days = Math.floor((now - timestamp) / 86400000);
  if (days === 0) return "Entrou hoje";
  if (days === 1) return "1 dia na etapa";
  return `${days} dias na etapa`;
}


export function selectInitialPipelineId(pipelines: Array<{ id: string; isDefault?: boolean }>): string {
  return (pipelines.find((pipeline) => pipeline.isDefault) ?? pipelines[0])?.id ?? "";
}

export function isLatestBoardResponse(currentRequestId: number, responseRequestId: number): boolean {
  return currentRequestId === responseRequestId;
}
