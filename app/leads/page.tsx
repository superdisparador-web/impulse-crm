"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AddLeadToPipelineDialog from "@/components/leads/AddLeadToPipelineDialog";
import ArchiveLeadDialog from "@/components/leads/ArchiveLeadDialog";
import LeadFilters from "@/components/leads/LeadFilters";
import LeadForm from "@/components/leads/LeadForm";
import { LeadDrawer } from "@/components/leads/LeadDrawer";
import LeadTable from "@/components/leads/LeadTable";
import { leadService } from "@/services/lead.service";
import { pipelineService } from "@/services/pipeline.service";
import { userService } from "@/services/user.service";
import { Lead, LeadListParams, LeadStatus, LeadTemperature } from "@/types/lead";
import { Pipeline } from "@/types/pipeline";
import { User } from "@/types/user";

const defaultFilters: LeadListParams = { page: 1, limit: 10, order: "desc", archived: false };

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [filters, setFilters] = useState<LeadListParams>(defaultFilters);
  const [searchInput, setSearchInput] = useState("");
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formLead, setFormLead] = useState<Lead | null | undefined>();
  const [drawerLeadId, setDrawerLeadId] = useState<string | null>(null);
  const [archiveLead, setArchiveLead] = useState<Lead | null>(null);
  const [pipelineLead, setPipelineLead] = useState<Lead | null>(null);
  const [pipelineMessage, setPipelineMessage] = useState("");
  const [busyLeadId, setBusyLeadId] = useState<string>();
  const requestRef = useRef(0);

  const load = useCallback(async (nextFilters = filters) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true); setError("");
    try {
      const [leadData, userData, pipelineData] = await Promise.all([leadService.getAll(nextFilters), userService.getAll({ limit: 100, active: true }), pipelineService.pipelines()]);
      if (requestId !== requestRef.current) return;
      setLeads(leadData.items); setMeta(leadData.meta ?? { total: leadData.total, page: leadData.page, limit: leadData.pageSize, totalPages: leadData.totalPages }); setUsers(userData.items); setPipelines(pipelineData);
    } catch (err) { if (requestId === requestRef.current) setError(err instanceof Error ? err.message : "Erro ao carregar leads."); }
    finally { if (requestId === requestRef.current) setLoading(false); }
  }, [filters]);

  useEffect(() => { const timeoutId = window.setTimeout(() => setFilters((current) => ({ ...current, page: 1, search: searchInput.trim() })), 350); return () => window.clearTimeout(timeoutId); }, [searchInput]);
  useEffect(() => { const timeoutId = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timeoutId); }, [load]);
  function notify(text: string) { setMessage(text); window.setTimeout(() => setMessage(""), 3000); }
  async function refresh(text: string) { notify(text); await load(); }
  async function mutateLead(lead: Lead, operation: () => Promise<Lead>, success: string) { setBusyLeadId(lead.id); try { const updated = await operation(); setLeads((current) => current.map((item) => item.id === updated.id ? updated : item)); notify(success); } catch (err) { setError(err instanceof Error ? err.message : "Erro ao atualizar lead."); } finally { setBusyLeadId(undefined); } }
  async function confirmArchive() { if (!archiveLead) return; setBusyLeadId(archiveLead.id); try { await leadService.archive(archiveLead.id); setLeads((current) => current.filter((item) => item.id !== archiveLead.id)); setDrawerLeadId((current) => current === archiveLead.id ? null : current); setArchiveLead(null); notify("Lead arquivado com sucesso."); } catch (err) { setError(err instanceof Error ? err.message : "Erro ao arquivar lead."); } finally { setBusyLeadId(undefined); } }
  async function addToPipeline(pipelineId: string, stageId: string) { if (!pipelineLead) return; setBusyLeadId(pipelineLead.id); setPipelineMessage(""); try { await pipelineService.addCard(pipelineId, { leadId: pipelineLead.id, stageId }); setPipelineLead(null); notify("Lead adicionado ao Pipeline."); } catch (err) { const text = err instanceof Error ? err.message : "Erro ao adicionar ao Pipeline."; setPipelineMessage(text.includes("pipeline") || text.includes("Pipeline") ? text : "Lead já está neste Pipeline ou a etapa não está disponível."); } finally { setBusyLeadId(undefined); } }

  return <main className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-4xl font-bold">Leads</h1><p className="mt-2 text-slate-400">Gerencie captação, classificação, atribuição e Lead 360°.</p></div><button type="button" onClick={() => setFormLead(null)} className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700">Novo Lead</button></div>{message && <div className="rounded-lg border border-green-800 bg-green-950/50 p-3 text-green-200">{message}</div>}{error && <div role="alert" className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-red-200">{error}</div>}<label className="block space-y-2"><span className="text-sm font-medium text-slate-200">Busca</span><input className="w-full rounded-xl border border-slate-700 bg-slate-900 p-4 outline-none focus:border-blue-500" placeholder="Buscar por nome, telefone, e-mail ou CPF..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} /></label><LeadFilters filters={filters} users={users} onChange={setFilters} /><LeadTable leads={leads} loading={loading} users={users} busyLeadId={busyLeadId} onView={(lead) => setDrawerLeadId(lead.id)} onEdit={setFormLead} onArchive={setArchiveLead} onAddToPipeline={(lead) => { setPipelineMessage(""); setPipelineLead(lead); }} onAssign={(lead, assignedUserId) => void mutateLead(lead, () => leadService.assign(lead.id, assignedUserId), "Responsável atualizado.")} onStatus={(lead, value: LeadStatus) => void mutateLead(lead, () => leadService.updateStatus(lead.id, value), "Status atualizado.")} onTemperature={(lead, value: LeadTemperature) => void mutateLead(lead, () => leadService.updateTemperature(lead.id, value), "Temperatura atualizada.")} /><div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400"><span>{meta.total} lead(s) • página {meta.page} de {meta.totalPages || 1}</span><label>Itens por página <select className="ml-2 rounded bg-slate-900 p-2" value={filters.limit ?? 10} onChange={(e) => setFilters({ ...filters, page: 1, limit: Number(e.target.value) })}>{[10,25,50,100].map((size) => <option key={size} value={size}>{size}</option>)}</select></label><div className="flex gap-2"><button type="button" disabled={meta.page <= 1} onClick={() => setFilters({ ...filters, page: Math.max(1, (filters.page ?? 1) - 1) })} className="rounded bg-slate-800 px-3 py-2 disabled:opacity-50">Anterior</button><button type="button" disabled={meta.page >= meta.totalPages} onClick={() => setFilters({ ...filters, page: Math.min(meta.totalPages, (filters.page ?? 1) + 1) })} className="rounded bg-slate-800 px-3 py-2 disabled:opacity-50">Próxima</button></div></div>{formLead !== undefined && <LeadForm key={formLead?.id ?? "new"} lead={formLead} users={users} onCancel={() => setFormLead(undefined)} onSuccess={(saved) => { setFormLead(undefined); setLeads((current) => formLead?.id ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]); void refresh("Lead salvo com sucesso."); }} />}{archiveLead && <ArchiveLeadDialog lead={archiveLead} saving={busyLeadId === archiveLead.id} onCancel={() => setArchiveLead(null)} onConfirm={() => void confirmArchive()} />}{pipelineLead && <AddLeadToPipelineDialog lead={pipelineLead} pipelines={pipelines} saving={busyLeadId === pipelineLead.id} message={pipelineMessage} onCancel={() => setPipelineLead(null)} onConfirm={(pipelineId, stageId) => void addToPipeline(pipelineId, stageId)} />}<LeadDrawer card={null} board={null} leadId={drawerLeadId} onClose={() => setDrawerLeadId(null)} onArchived={() => void refresh("Lead arquivado com sucesso.")} onEdit={(lead) => setFormLead(lead)} /></main>;
}
