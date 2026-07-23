import { PipelineBoard, PipelineCard } from "@/types/pipeline-board";

export function formatDateTime(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function translateTemperature(value?: string | null) {
  const labels: Record<string, string> = { HOT: "Quente", WARM: "Morno", COLD: "Frio", UNKNOWN: "Sem temperatura" };
  return value ? labels[value] ?? value : "Sem temperatura";
}

export function translateStatus(value?: string | null) {
  const labels: Record<string, string> = { NEW: "Novo", ASSIGNED: "Atribuído", CONTACT_PENDING: "Contato pendente", IN_CONTACT: "Em contato", QUALIFIED: "Qualificado", UNQUALIFIED: "Desqualificado", CONVERTED: "Convertido", LOST: "Perdido", ARCHIVED: "Arquivado" };
  return value ? labels[value] ?? value : "Sem status";
}

export function buildPipelineHistory(board: PipelineBoard, card: PipelineCard) {
  return board.stages.map((stage) => ({ id: stage.id, name: stage.name, date: stage.id === card.stageId ? card.enteredStageAt ?? null : null, current: stage.id === card.stageId }));
}
