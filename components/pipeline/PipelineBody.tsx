import { KanbanBoard, DropTarget } from "./KanbanBoard";
import { PipelineEmptyState, PipelineErrorState } from "./PipelineStates";
import { PipelineBoard } from "@/types/pipeline-board";
import Card from "@/components/ui/Card";

export function PipelineBody({
  error,
  moveError,
  isLoading,
  pipelineCount,
  board,
  activeCardId,
  moving,
  onDragStart,
  onDropCard,
  onOpenCard,
}: {
  error: string;
  moveError: string;
  isLoading: boolean;
  pipelineCount: number;
  board: PipelineBoard | null;
  activeCardId: string;
  moving: boolean;
  onDragStart: (cardId: string) => void;
  onDropCard: (target: DropTarget) => void;
  onOpenCard: (cardId: string) => void;
}) {
  const hasLeads = Boolean(
    board?.stages.some(
      (stage) => stage.cards.length > 0 || Boolean(stage.total),
    ),
  );
  return (
    <section className="space-y-4" aria-label="Quadro Kanban">
      {error && <PipelineErrorState message={error} />}
      {moveError && <PipelineErrorState message={moveError} />}
      {isLoading && (
        <div
          className="grid gap-4 md:grid-cols-3"
          aria-live="polite"
          aria-label="Carregando Pipeline"
        >
          <span className="sr-only">Carregando Pipeline...</span>
          {[1, 2, 3].map((item) => (
            <Card key={item} padding="none" className="h-96 animate-pulse">
              <div className="h-16 rounded-t-2xl border-b border-slate-200 bg-slate-50" />
            </Card>
          ))}
        </div>
      )}
      {!isLoading && pipelineCount === 0 && (
        <PipelineEmptyState
          title="Nenhuma pipeline encontrada"
          description="Crie uma pipeline para começar a visualizar seu funil comercial."
        />
      )}
      {!isLoading && pipelineCount > 0 && !board && !error && (
        <PipelineEmptyState
          title="Selecione uma pipeline"
          description="Escolha uma pipeline no cabeçalho para visualizar suas etapas e leads."
        />
      )}
      {!isLoading &&
        pipelineCount > 0 &&
        board &&
        board.stages.length === 0 && (
          <PipelineEmptyState
            title="Pipeline sem etapas"
            description="Adicione etapas para começar a organizar seus leads."
          />
        )}
      {!isLoading && board && board.stages.length > 0 && !hasLeads && (
        <PipelineEmptyState
          title="Pipeline sem leads"
          description="Os leads adicionados ao funil aparecerão aqui, organizados por etapa."
        />
      )}
      {!isLoading && board && board.stages.length > 0 && hasLeads && (
        <KanbanBoard
          board={board}
          activeCardId={activeCardId}
          moving={moving}
          onDragStart={onDragStart}
          onDropCard={onDropCard}
          onOpenCard={onOpenCard}
        />
      )}
    </section>
  );
}
