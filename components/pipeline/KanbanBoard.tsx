import { DndContext } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { PipelineBoard, PipelineStage } from "@/types/pipeline-board";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import { MemoizedLeadCard } from "./LeadCard";

export type DropTarget = { cardId: string; stageId: string; index: number };
let pointerCardId = "";

function KeyboardMoveControls({
  cardId,
  stages,
  currentStageId,
  onMove,
}: {
  cardId: string;
  stages: PipelineStage[];
  currentStageId: string;
  onMove: (target: DropTarget) => void;
}) {
  return (
    <label className="mt-2 grid gap-1 text-xs text-slate-500">
      <span>Mover lead sem arrastar</span>
      <Select
        aria-label="Mover lead para etapa"
        options={[
          { value: "", label: "Escolha uma etapa" },
          ...stages
            .filter((stage) => stage.id !== currentStageId)
            .map((stage) => ({ value: stage.id, label: stage.name })),
        ]}
        defaultValue=""
        className="py-2"
        onChange={(event) => {
          const stageId = event.target.value;
          const stage = stages.find((item) => item.id === stageId);
          if (stage) onMove({ cardId, stageId, index: stage.cards.length });
          event.currentTarget.value = "";
        }}
      />
    </label>
  );
}

function autoScroll(event: React.PointerEvent) {
  const edge = 72;
  const board = event.currentTarget.closest(
    "[data-kanban-scroll]",
  ) as HTMLElement | null;
  if (board) {
    const rect = board.getBoundingClientRect();
    if (event.clientX < rect.left + edge) board.scrollLeft -= 18;
    else if (event.clientX > rect.right - edge) board.scrollLeft += 18;
  }
  const column = (event.target as HTMLElement).closest(
    "[data-column-scroll]",
  ) as HTMLElement | null;
  if (column) {
    const rect = column.getBoundingClientRect();
    if (event.clientY < rect.top + edge) column.scrollTop -= 14;
    else if (event.clientY > rect.bottom - edge) column.scrollTop += 14;
  }
}

function DropZone({
  stageId,
  index,
  onDropCard,
}: {
  stageId: string;
  index: number;
  onDropCard: (target: DropTarget) => void;
}) {
  return (
    <div
      data-drop-zone
      data-stage-id={stageId}
      data-index={index}
      onPointerUp={() => {
        if (pointerCardId)
          onDropCard({ cardId: pointerCardId, stageId, index });
        pointerCardId = "";
      }}
      className="pipeline-drop-zone h-2 rounded-full transition-all duration-200 hover:h-8 hover:bg-blue-500/20"
    />
  );
}

function KanbanColumn({
  stage,
  stages,
  metrics,
  activeCardId,
  onDragStart,
  onDropCard,
  onOpenCard,
}: {
  stage: PipelineStage;
  stages: PipelineStage[];
  metrics?: PipelineBoard["metrics"];
  activeCardId: string;
  onDragStart: (cardId: string) => void;
  onDropCard: (target: DropTarget) => void;
  onOpenCard: (cardId: string) => void;
}) {
  const total = metrics?.total ?? 0;
  const count = stage.total ?? stage.cards.length;
  const percentage = total ? Math.round((count / total) * 100) : 0;
  const color = stage.color ?? "#3b82f6";
  return (
    <section
      aria-label={`Etapa ${stage.name}`}
      data-column-scroll
      onPointerMove={autoScroll}
      onPointerUp={() => {
        if (pointerCardId)
          onDropCard({
            cardId: pointerCardId,
            stageId: stage.id,
            index: stage.cards.length,
          });
        pointerCardId = "";
      }}
      className="pipeline-column flex max-h-[70dvh] min-h-[30rem] w-[min(88vw,22rem)] shrink-0 flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 shadow-sm transition-colors duration-200"
    >
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 p-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h2 className="min-w-0 flex-1 truncate font-semibold text-slate-900">
            {stage.name}
          </h2>
          <Badge variant="primary">{count}</Badge>
          <span className="text-xs font-medium text-slate-500">
            {percentage}%
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </header>
      <div className="flex flex-1 flex-col p-3">
        {stage.cards.length === 0 ? (
          <div className="m-1 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Etapa sem cards. Arraste leads para cá.
          </div>
        ) : (
          stage.cards.map((card, index) => (
            <div
              key={card.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const cardId = event.dataTransfer.getData("text/pipeline-card");
                if (cardId) onDropCard({ cardId, stageId: stage.id, index });
              }}
            >
              <DropZone
                stageId={stage.id}
                index={index}
                onDropCard={onDropCard}
              />
              <div
                onPointerDown={(event) => {
                  if ((event.target as HTMLElement).closest("a,button,select"))
                    return;
                  pointerCardId = card.id;
                  event.currentTarget.setPointerCapture?.(event.pointerId);
                  onDragStart(card.id);
                }}
                onPointerUp={() => onDragStart("")}
                className="pipeline-virtual-card touch-none transition-all duration-200"
              >
                <div className="mb-1 flex items-center justify-center text-slate-400">
                  <GripVertical size={15} />
                </div>
                <MemoizedLeadCard
                  card={{ ...card, stageId: stage.id }}
                  dragging={activeCardId === card.id}
                  onOpen={() => onOpenCard(card.id)}
                />
              </div>
              <KeyboardMoveControls
                cardId={card.id}
                stages={stages}
                currentStageId={stage.id}
                onMove={onDropCard}
              />
            </div>
          ))
        )}
        <DropZone
          stageId={stage.id}
          index={stage.cards.length}
          onDropCard={onDropCard}
        />
      </div>
    </section>
  );
}

export function KanbanBoard({
  board,
  activeCardId,
  moving,
  onDragStart,
  onDropCard,
  onOpenCard = () => {},
}: {
  board: PipelineBoard;
  activeCardId: string;
  moving: boolean;
  onDragStart: (cardId: string) => void;
  onDropCard: (target: DropTarget) => void;
  onOpenCard?: (cardId: string) => void;
}) {
  return (
    <DndContext autoScroll>
      <Card padding="sm">
        <div aria-busy={moving} className="relative" aria-live="polite">
          <div
            data-kanban-scroll
            className="pipeline-board-scroll flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4"
            role="list"
            aria-label="Kanban do pipeline"
          >
            {board.stages.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                stages={board.stages}
                metrics={board.metrics}
                activeCardId={activeCardId}
                onDragStart={onDragStart}
                onDropCard={onDropCard}
                onOpenCard={onOpenCard}
              />
            ))}
          </div>
          {moving && (
            <div className="fixed bottom-5 right-5 z-50 animate-pulse rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-xl">
              Salvando movimentação...
            </div>
          )}
        </div>
      </Card>
    </DndContext>
  );
}
