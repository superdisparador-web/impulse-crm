import { Lead, LeadActivity, LeadEvent } from "@/types/lead";
import { Lead360TimelineItem, LeadNote } from "@/types/lead-360";
import { PipelineCard } from "@/types/pipeline-board";

export function mapLeadTimeline({ lead, card, events, activities, notes }: { lead: Lead; card?: PipelineCard | null; events: LeadEvent[]; activities: LeadActivity[]; notes: LeadNote[] }): Lead360TimelineItem[] {
  const items: Lead360TimelineItem[] = [
    { id: `lead-created-${lead.id}`, title: "Lead criado", occurredAt: lead.createdAt, kind: "lead" },
    ...(card?.enteredStageAt ? [{ id: `pipeline-entered-${card.id}`, title: "Entrou no Pipeline", occurredAt: card.enteredStageAt, kind: "pipeline" as const }] : []),
    ...events.map((event) => ({ id: event.id, title: event.description || event.eventType, occurredAt: event.occurredAt, kind: "lead" as const })),
    ...notes.map((note) => ({ id: note.id, title: "Observação", description: note.text, occurredAt: note.updatedAt, kind: "note" as const })),
    ...activities.map((activity) => ({ id: activity.id, title: activity.title, description: activity.note ?? undefined, occurredAt: activity.dueAt, kind: "activity" as const })),
  ];
  return items.sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
}
