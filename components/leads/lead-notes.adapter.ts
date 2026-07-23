import { LeadNote } from "@/types/lead-360";

interface SerializedLeadNotes {
  version: 1;
  notes: LeadNote[];
}

const notePrefix = "lead360-notes:";

export function parseLeadNotes(raw?: string | null): LeadNote[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SerializedLeadNotes;
    if (parsed.version === 1 && Array.isArray(parsed.notes)) return parsed.notes.filter((note) => note.id && note.text);
  } catch {
    return legacyNote(raw);
  }
  return legacyNote(raw);
}

export function serializeLeadNotes(notes: LeadNote[]) {
  return JSON.stringify({ version: 1, notes } satisfies SerializedLeadNotes);
}

export function createLeadNote(text: string, now = new Date(), random = Math.random()) {
  const timestamp = now.toISOString();
  return { id: `${notePrefix}${timestamp}:${random.toString(36).slice(2)}`, text: text.trim(), createdAt: timestamp, updatedAt: timestamp } satisfies LeadNote;
}

export function sortLeadNotes(notes: LeadNote[]) {
  return [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function legacyNote(raw: string): LeadNote[] {
  return [{ id: "legacy-note", text: raw, createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() }];
}
