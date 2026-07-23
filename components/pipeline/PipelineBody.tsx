import { KanbanBoard, DropTarget } from "./KanbanBoard";
import { PipelineEmptyState, PipelineErrorState } from "./PipelineStates";
import { PipelineBoard } from "@/types/pipeline-board";

export function PipelineBody({ error, moveError, isLoading, pipelineCount, board, activeCardId, moving, onDragStart, onDropCard }: { error: string; moveError: string; isLoading: boolean; pipelineCount: number; board: PipelineBoard | null; activeCardId: string; moving: boolean; onDragStart: (cardId: string) => void; onDropCard: (target: DropTarget) => void }) {
  return <>{error && <PipelineErrorState message={error} />}{moveError && <PipelineErrorState message={moveError} />}{isLoading && <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-slate-300" aria-live="polite">Carregando Pipeline...</div>}{!isLoading && pipelineCount === 0 && <PipelineEmptyState title="Nenhuma pipeline encontrada" description="Crie uma pipeline no backend para visualizar o Kanban." />}{!isLoading && pipelineCount > 0 && board && board.stages.length === 0 && <PipelineEmptyState title="Nenhuma etapa encontrada" description="Adicione etapas para começar a organizar seus leads." />}{!isLoading && board && board.stages.length > 0 && <KanbanBoard board={board} activeCardId={activeCardId} moving={moving} onDragStart={onDragStart} onDropCard={onDropCard} />}</>;
}
