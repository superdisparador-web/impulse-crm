"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { LeadActivity, LeadActivityFormData } from "@/types/lead";
import { formatDateTime } from "./lead360-utils";

const options = ["Ligação", "WhatsApp", "Visita", "Reunião", "Retorno"];

export function LeadActivities({ activities, responsibleUserId, saving, onCreate }: { activities: LeadActivity[]; responsibleUserId?: string | null; saving: boolean; onCreate: (data: LeadActivityFormData) => void }) {
  const [title, setTitle] = useState(options[0]);
  const [dueAt, setDueAt] = useState("");
  const [note, setNote] = useState("");
  function submit() { if (!dueAt || !responsibleUserId) return; onCreate({ title, dueAt: new Date(dueAt).toISOString(), responsibleUserId, note: note || null, status: "PENDING", priority: "MEDIUM" }); setDueAt(""); setNote(""); }
  return <section className="space-y-3"><h3 className="text-lg font-semibold text-white">Atividades</h3><div className="grid gap-2 rounded-xl border border-slate-800 p-3"><select value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-800 p-3 text-white">{options.map((option) => <option key={option}>{option}</option>)}</select><Input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /><Input placeholder="Detalhes" value={note} onChange={(event) => setNote(event.target.value)} /><Button onClick={submit} disabled={saving || !dueAt || !responsibleUserId} className="px-3 py-2 text-sm">Criar atividade</Button>{!responsibleUserId && <p className="text-xs text-amber-300">Defina um corretor responsável para criar atividades.</p>}</div><ul className="space-y-2">{activities.map((activity) => <li key={activity.id} className="rounded-xl border border-slate-800 p-3"><p className="font-medium text-slate-100">{activity.title}</p><p className="text-sm text-slate-400">{activity.note}</p><time className="text-xs text-slate-500">{formatDateTime(activity.dueAt)}</time></li>)}</ul></section>;
}
