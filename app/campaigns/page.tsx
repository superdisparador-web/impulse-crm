"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { campaignsService } from "@/services/campaigns.service";
import { Campaign, CampaignFilters, CampaignStatus, CampaignType } from "@/types/campaign";

const statuses: CampaignStatus[] = ["DRAFT", "SCHEDULED", "RUNNING", "PAUSED", "COMPLETED", "CANCELED"];
const types: CampaignType[] = ["MARKETING", "UTILITY", "AUTHENTICATION"];
const labels: Record<string, string> = { DRAFT: "Rascunho", SCHEDULED: "Agendada", RUNNING: "Em execução", PAUSED: "Pausada", COMPLETED: "Concluída", CANCELED: "Cancelada", MARKETING: "Marketing", UTILITY: "Utilidade", AUTHENTICATION: "Autenticação" };

export default function CampaignsPage() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [filters, setFilters] = useState<CampaignFilters>({ page: 1, limit: 10 });
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => { setLoading(true); setError(""); try { const data = await campaignsService.getCampaigns(filters); setItems(data.items); setMeta(data.meta); } catch (err) { setError(err instanceof Error ? err.message : "Erro ao carregar campanhas."); } finally { setLoading(false); } }, [filters]);
  useEffect(() => { const timeoutId = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timeoutId); }, [load]);

  async function runAction(campaignId: string, text: string, fn: () => Promise<unknown>) { if (actionLoading) return; setActionLoading(campaignId); setError(""); try { await fn(); setMessage(text); await load(); window.setTimeout(() => setMessage(""), 3000); } catch (err) { setError(err instanceof Error ? err.message : "Erro na ação."); } finally { setActionLoading(null); } }

  return <main className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-4xl font-bold">Campanhas</h1><p className="mt-2 text-slate-400">Crie e organize campanhas. Integração com WhatsApp, filas e disparos ficará para uma próxima etapa.</p></div><Link className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700" href="/campaigns/new">Nova Campanha</Link></div>
    {message && <div className="rounded-lg border border-green-800 bg-green-950/50 p-3 text-green-200">{message}</div>}{error && <div className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-red-200">{error}</div>}
    <div className="grid gap-3 md:grid-cols-4"><input className="rounded-xl border border-slate-700 bg-slate-900 p-3" placeholder="Buscar por nome ou descrição" value={filters.search ?? ""} onChange={(e)=>setFilters(c=>({...c,page:1,search:e.target.value}))}/><select className="rounded-xl border border-slate-700 bg-slate-900 p-3" value={filters.status ?? ""} onChange={(e)=>setFilters(c=>({...c,page:1,status:e.target.value as CampaignStatus|""}))}><option value="">Todos os status</option>{statuses.map(s=><option key={s} value={s}>{labels[s]}</option>)}</select><select className="rounded-xl border border-slate-700 bg-slate-900 p-3" value={filters.campaignType ?? ""} onChange={(e)=>setFilters(c=>({...c,page:1,campaignType:e.target.value as CampaignType|""}))}><option value="">Todos os tipos</option>{types.map(t=><option key={t} value={t}>{labels[t]}</option>)}</select><label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 p-3"><input type="checkbox" checked={Boolean(filters.archived)} onChange={(e)=>setFilters(c=>({...c,page:1,archived:e.target.checked}))}/> Arquivadas</label></div>
    <div className="overflow-x-auto rounded-xl border border-slate-800"><table className="w-full text-sm"><thead className="bg-slate-900 text-slate-300"><tr><th className="p-3 text-left">Nome</th><th>Status</th><th>Tipo</th><th>Filtros</th><th>Criada em</th><th>Agendamento</th><th>Ações</th></tr></thead><tbody>{loading ? <tr><td className="p-6" colSpan={7}>Carregando...</td></tr> : items.length === 0 ? <tr><td className="p-6 text-slate-400" colSpan={7}>Nenhuma campanha encontrada.</td></tr> : items.map(campaign=><tr key={campaign.id} className="border-t border-slate-800"><td className="p-3 font-medium">{campaign.name}</td><td><span className="rounded-full bg-slate-800 px-2 py-1">{labels[campaign.status] ?? campaign.status}</span></td><td>{labels[campaign.campaignType]}</td><td>{campaign._count?.filters ?? campaign.filters?.length ?? 0}</td><td>{new Date(campaign.createdAt).toLocaleString()}</td><td>{campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleString() : "-"}</td><td className="flex flex-wrap gap-2 p-3"><Link className="text-blue-300" href={`/campaigns/${campaign.id}`}>Visualizar</Link><button disabled={Boolean(actionLoading)} onClick={()=>void runAction(campaign.id, campaign.archivedAt ? "Campanha restaurada do arquivo." : "Campanha arquivada.", ()=>campaignsService.archiveCampaign(campaign.id, !campaign.archivedAt))}>{campaign.archivedAt ? "Desarquivar" : "Arquivar"}</button><button disabled={Boolean(actionLoading)} onClick={()=>void runAction(campaign.id,"Campanha cancelada.",()=>campaignsService.cancelCampaign(campaign.id))}>Cancelar</button><button className="text-red-300" disabled={Boolean(actionLoading)} onClick={()=>{ if(!window.confirm(`Excluir ${campaign.name}?`)) return; void runAction(campaign.id,"Campanha excluída.",()=>campaignsService.deleteCampaign(campaign.id));}}>Excluir</button></td></tr>)}</tbody></table></div>
    <div className="flex justify-between text-sm text-slate-400"><span>{meta.total} campanha(s) • página {meta.page} de {meta.totalPages || 1}</span><div className="flex gap-2"><button disabled={meta.page <= 1} className="rounded bg-slate-800 px-3 py-2 disabled:opacity-50" onClick={()=>setFilters(c=>({...c,page:(c.page??1)-1}))}>Anterior</button><button disabled={meta.page >= meta.totalPages} className="rounded bg-slate-800 px-3 py-2 disabled:opacity-50" onClick={()=>setFilters(c=>({...c,page:(c.page??1)+1}))}>Próxima</button></div></div>
  </main>;
}
