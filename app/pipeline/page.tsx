"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LeadDetails from "@/components/leads/LeadDetails";
import PipelineBoard from "@/components/pipeline/PipelineBoard";
import PipelineFilters from "@/components/pipeline/PipelineFilters";
import PipelineHeader from "@/components/pipeline/PipelineHeader";
import { leadService } from "@/services/lead.service";
import { pipelineService } from "@/services/pipeline.service";
import { Lead, LeadListParams } from "@/types/lead";
import { Pipeline } from "@/types/pipeline";

const PIPELINE_LEADS_PAGE_SIZE = 50;

async function loadPipelineLeads(params: Omit<LeadListParams, "page" | "limit">) {
  const items: Lead[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await leadService.getAll({ ...params, page, limit: PIPELINE_LEADS_PAGE_SIZE });
    items.push(...response.items);
    totalPages = response.meta.totalPages || 1;
    page += 1;
  } while (page <= totalPages);

  return items;
}

export default function PipelinePage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pipelineId, setPipelineId] = useState("");
  const [search, setSearch] = useState("");
  const [loadingPipelines, setLoadingPipelines] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [detailLead, setDetailLead] = useState<Lead | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadPipelines() {
      try {
        const pipelineData = await pipelineService.getAll({ active: true });
        if (ignore) return;
        setPipelines(pipelineData);
        setPipelineId((current) => current || pipelineData[0]?.id || "");
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "Erro ao carregar pipelines.");
      } finally {
        if (!ignore) setLoadingPipelines(false);
      }
    }

    void loadPipelines();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!pipelineId) return;

    let ignore = false;

    async function loadLeads() {
      setLoadingLeads(true);
      try {
        const leadItems = await loadPipelineLeads({ pipelineId, search });
        if (!ignore) setLeads(leadItems);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "Erro ao carregar leads do pipeline.");
      } finally {
        if (!ignore) setLoadingLeads(false);
      }
    }

    void loadLeads();
    return () => { ignore = true; };
  }, [pipelineId, search]);

  const selectedPipeline = useMemo(() => pipelines.find((pipeline) => pipeline.id === pipelineId) ?? null, [pipelineId, pipelines]);
  const visibleLeads = pipelineId ? leads : [];
  const activeStages = useMemo(() => selectedPipeline?.stages.filter((stage) => stage.active) ?? [], [selectedPipeline]);

  const openLead = useCallback(async (lead: Lead) => {
    try { setDetailLead(await leadService.getById(lead.id)); } catch { setError("Erro ao carregar detalhes do lead."); }
  }, []);

  const moveLead = useCallback(async (leadId: string, stageId: string) => {
    const previousLeads = leads;
    setMovingLeadId(leadId);
    setLeads((current) => current.map((lead) => lead.id === leadId ? { ...lead, stageId, pipelineId } : lead));
    try {
      const movedLead = await leadService.move(leadId, stageId);
      setLeads((current) => current.map((lead) => lead.id === leadId ? movedLead : lead));
    } catch (err) {
      setLeads(previousLeads);
      setError(err instanceof Error ? err.message : "Erro ao mover lead.");
    } finally {
      setMovingLeadId(null);
    }
  }, [leads, pipelineId]);

  const isLoading = loadingPipelines || loadingLeads;

  return (
    <main className="space-y-6">
      <PipelineHeader totalLeads={visibleLeads.length} totalStages={activeStages.length} />
      {error && <div role="alert" className="rounded-2xl border border-red-800 bg-red-950/50 p-4 text-red-100"><strong className="block">Não foi possível concluir a ação.</strong><span className="text-sm text-red-200/80">{error}</span></div>}
      {loadingPipelines ? <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-slate-400">Carregando pipelines...</div> : <PipelineFilters pipelines={pipelines} pipelineId={pipelineId} search={search} onPipelineChange={setPipelineId} onSearchChange={setSearch} />}
      {isLoading ? <div className="grid grid-cols-3 gap-4 overflow-hidden"><div className="h-96 animate-pulse rounded-3xl bg-slate-900" /><div className="h-96 animate-pulse rounded-3xl bg-slate-900" /><div className="h-96 animate-pulse rounded-3xl bg-slate-900" /></div> : selectedPipeline ? <PipelineBoard stages={activeStages} leads={visibleLeads} movingLeadId={movingLeadId} onOpenLead={openLead} onMoveLead={moveLead} /> : <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950 p-10 text-center text-slate-400">Nenhum pipeline ativo encontrado para sua organização.</div>}
      {detailLead && <LeadDetails lead={detailLead} onClose={() => setDetailLead(null)} />}
    </main>
  );
}
