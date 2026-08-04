"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { PipelineStage } from "@/types/pipeline-board";

export function StageManager({ stages, saving, error, onCreate, onUpdate, onDelete, onReorder }: { stages: PipelineStage[]; saving: boolean; error?: string; onCreate: (name: string, color: string) => Promise<void>; onUpdate: (stage: PipelineStage, name: string, color: string) => Promise<void>; onDelete: (stage: PipelineStage) => Promise<void>; onReorder: (stages: PipelineStage[]) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PipelineStage | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const begin = (stage?: PipelineStage) => { setEditing(stage ?? null); setName(stage?.name ?? ""); setColor(stage?.color ?? "#3b82f6"); };
  const move = (index: number, offset: number) => { const next = [...stages]; const destination = index + offset; if (destination < 0 || destination >= next.length) return; [next[index], next[destination]] = [next[destination], next[index]]; void onReorder(next); };

  return <>
    <Button variant="secondary" onClick={() => { setOpen(true); begin(); }}><Settings2 size={17} />Gerenciar etapas</Button>
    <Modal isOpen={open} title="Gerenciar etapas" onClose={() => setOpen(false)} width="lg">
      <p className="mb-5 text-sm text-slate-500">Configure nomes, cores e a ordem do seu funil.</p>
      <form onSubmit={(event) => { event.preventDefault(); void (async () => { if (editing) await onUpdate(editing, name.trim(), color); else await onCreate(name.trim(), color); begin(); })(); }} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-end">
        <label className="block text-sm font-medium text-slate-700">Cor<input aria-label="Cor da etapa" type="color" value={color} onChange={(event) => setColor(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white p-1 sm:w-14" /></label>
        <Input autoFocus label="Nome da etapa" aria-label="Nome da etapa" value={name} maxLength={120} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Proposta enviada" />
        <Button type="submit" disabled={saving || !name.trim()} loading={saving}><Plus size={16} />{editing ? "Salvar" : "Adicionar"}</Button>
      </form>
      {error && <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <ul className="mt-5 space-y-2">{stages.map((stage, index) => <li key={stage.id} className={`flex items-center gap-3 rounded-xl border p-3 transition ${editing?.id === stage.id ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
        <span className="h-4 w-4 rounded-full ring-2 ring-white" style={{ backgroundColor: stage.color ?? "#3b82f6" }} />
        <div className="min-w-0 flex-1"><p className="truncate font-medium text-slate-900">{stage.name}</p><p className="text-xs text-slate-500">{stage.total ?? stage.cards.length} leads</p></div>
        <Button variant="ghost" size="sm" aria-label={`Subir ${stage.name}`} disabled={saving || index === 0} onClick={() => move(index, -1)}><ArrowUp size={16} /></Button>
        <Button variant="ghost" size="sm" aria-label={`Descer ${stage.name}`} disabled={saving || index === stages.length - 1} onClick={() => move(index, 1)}><ArrowDown size={16} /></Button>
        <Button variant="ghost" size="sm" aria-label={`Editar ${stage.name}`} onClick={() => begin(stage)} className="text-blue-600"><Pencil size={16} /></Button>
        <Button variant="ghost" size="sm" aria-label={`Excluir ${stage.name}`} disabled={saving || stage.cards.length > 0 || Boolean(stage.total)} onClick={() => { if (window.confirm(`Excluir a etapa “${stage.name}”?`)) void onDelete(stage); }} className="text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 size={16} /></Button>
      </li>)}</ul>
    </Modal>
  </>;
}
