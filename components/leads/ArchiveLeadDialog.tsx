import { useEffect, useRef } from 'react';
import { Lead } from '@/types/lead';

type Props = { lead: Lead; saving: boolean; onCancel: () => void; onConfirm: () => void };
export default function ArchiveLeadDialog({ lead, saving, onCancel, onConfirm }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { buttonRef.current?.focus(); const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && !saving) onCancel(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [onCancel, saving]);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="archive-lead-title"><button aria-label="Fechar confirmação" className="absolute inset-0" disabled={saving} onClick={onCancel} /><div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"><h2 id="archive-lead-title" className="text-xl font-bold">Arquivar lead?</h2><p className="mt-2 text-slate-300">O lead {lead.name ? <strong>{lead.name}</strong> : 'selecionado'} será removido da lista de ativos, sem exclusão definitiva.</p><div className="mt-6 flex justify-end gap-3"><button ref={buttonRef} type="button" disabled={saving} onClick={onCancel} className="rounded-lg bg-slate-800 px-4 py-2 disabled:opacity-60">Cancelar</button><button type="button" disabled={saving} onClick={onConfirm} className="rounded-lg bg-red-700 px-4 py-2 disabled:opacity-60">{saving ? 'Arquivando...' : 'Arquivar'}</button></div></div></div>;
}
