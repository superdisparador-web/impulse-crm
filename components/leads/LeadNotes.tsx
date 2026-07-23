"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { LeadNote } from "@/types/lead-360";
import { formatDateTime } from "./lead360-utils";
import { createLeadNote, sortLeadNotes } from "./lead-notes.adapter";

export function LeadNotes({ notes, saving, onChange }: { notes: LeadNote[]; saving: boolean; onChange: (notes: LeadNote[]) => void }) {
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editingText, setEditingText] = useState("");
  function addNote() { const next = text.trim(); if (!next) return; onChange(sortLeadNotes([createLeadNote(next), ...notes])); setText(""); }
  function saveEdit(id: string) { const next = editingText.trim(); if (!next) return; onChange(sortLeadNotes(notes.map((note) => note.id === id ? { ...note, text: next, updatedAt: new Date().toISOString() } : note))); setEditingId(""); setEditingText(""); }
  return <section className="space-y-3"><h3 className="text-lg font-semibold text-white">Observações</h3><div className="space-y-2"><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Adicionar observação" className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white outline-none focus:border-blue-500" /><Button onClick={addNote} disabled={saving || !text.trim()} className="px-3 py-2 text-sm">Adicionar observação</Button></div><ul className="space-y-3">{sortLeadNotes(notes).map((note) => <li key={note.id} className="rounded-xl border border-slate-800 p-3">{editingId === note.id ? <div className="space-y-2"><textarea value={editingText} onChange={(event) => setEditingText(event.target.value)} className="min-h-20 w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm text-white" /><Button onClick={() => saveEdit(note.id)} disabled={saving} className="px-3 py-2 text-sm">Salvar</Button></div> : <><p className="text-sm text-slate-200">{note.text}</p><time className="text-xs text-slate-500">{formatDateTime(note.updatedAt)}</time><div className="mt-2 flex gap-2"><button className="text-xs text-blue-300" onClick={() => { setEditingId(note.id); setEditingText(note.text); }}>Editar</button><button className="text-xs text-red-300" onClick={() => onChange(notes.filter((item) => item.id !== note.id))}>Excluir</button></div></>}</li>)}</ul></section>;
}
