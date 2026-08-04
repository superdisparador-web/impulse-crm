"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import AddLeadToPipelineDialog from "@/components/leads/AddLeadToPipelineDialog";
import ArchiveLeadDialog from "@/components/leads/ArchiveLeadDialog";
import { LeadDrawer } from "@/components/leads/LeadDrawer";
import LeadFilters from "@/components/leads/LeadFilters";
import LeadForm from "@/components/leads/LeadForm";
import LeadTable from "@/components/leads/LeadTable";
import LeadStats from "@/components/leads/LeadStats";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SearchBar from "@/components/ui/SearchBar";
import PageHeader from "@/components/ui/PageHeader";

import { leadService } from "@/services/lead.service";
import { pipelineService } from "@/services/pipeline.service";
import { userService } from "@/services/user.service";

import {
  Lead,
  LeadListParams,
  LeadStatus,
  LeadTemperature,
} from "@/types/lead";
import { Pipeline } from "@/types/pipeline";
import { User } from "@/types/user";

const defaultFilters: LeadListParams = {
  page: 1,
  limit: 10,
  order: "desc",
  archived: false,
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);

  const [filters, setFilters] =
    useState<LeadListParams>(defaultFilters);

  const [searchInput, setSearchInput] = useState("");

  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [formLead, setFormLead] =
    useState<Lead | null | undefined>();

  const [drawerLeadId, setDrawerLeadId] =
    useState<string | null>(null);

  const [archiveLead, setArchiveLead] =
    useState<Lead | null>(null);

  const [pipelineLead, setPipelineLead] =
    useState<Lead | null>(null);

  const [pipelineMessage, setPipelineMessage] =
    useState("");

  const [busyLeadId, setBusyLeadId] =
    useState<string>();

  const requestRef = useRef(0);

  const totalLeads = meta.total;

  const hotLeads = leads.filter(
    (lead) => lead.temperature === "HOT"
  ).length;

  const contactedLeads = leads.filter(
    (lead) =>
      lead.status === "CONTACT_PENDING" ||
      lead.status === "IN_CONTACT"
  ).length;

  const convertedLeads = leads.filter(
    (lead) =>
      lead.status === "CONVERTED"
  ).length;


  const load = useCallback(
    async (nextFilters = filters) => {
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;

      setLoading(true);
      setError("");

      try {
        const [leadData, userData, pipelineData] =
          await Promise.all([
            leadService.getAll(nextFilters),
            userService.getAll({
              limit: 100,
              active: true,
            }),
            pipelineService.pipelines(),
          ]);

        if (requestId !== requestRef.current) {
          return;
        }

        setLeads(leadData.items);

        setMeta(
          leadData.meta ?? {
            total: leadData.total,
            page: leadData.page,
            limit: leadData.pageSize,
            totalPages: leadData.totalPages,
          }
        );

        setUsers(userData.items);
        setPipelines(pipelineData);
      } catch (err) {
        if (requestId === requestRef.current) {
          setError(
            err instanceof Error
              ? err.message
              : "Erro ao carregar leads."
          );
        }
      } finally {
        if (requestId === requestRef.current) {
          setLoading(false);
        }
      }
    },
    [filters]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFilters((current) => ({
        ...current,
        page: 1,
        search: searchInput.trim(),
      }));
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [load]);

  function notify(text: string) {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  async function refresh(text: string) {
    notify(text);
    await load();
  }

  async function mutateLead(
    lead: Lead,
    operation: () => Promise<Lead>,
    success: string
  ) {
    setBusyLeadId(lead.id);

    try {
      const updated = await operation();

      setLeads((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item
        )
      );

      notify(success);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao atualizar lead."
      );
    } finally {
      setBusyLeadId(undefined);
    }
  }

  async function confirmArchive() {
    if (!archiveLead) {
      return;
    }

    setBusyLeadId(archiveLead.id);

    try {
      await leadService.archive(archiveLead.id);

      setLeads((current) =>
        current.filter(
          (item) => item.id !== archiveLead.id
        )
      );

      setDrawerLeadId((current) =>
        current === archiveLead.id ? null : current
      );

      setArchiveLead(null);
      notify("Lead arquivado com sucesso.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao arquivar lead."
      );
    } finally {
      setBusyLeadId(undefined);
    }
  }

  async function addToPipeline(
    pipelineId: string,
    stageId: string
  ) {
    if (!pipelineLead) {
      return;
    }

    setBusyLeadId(pipelineLead.id);
    setPipelineMessage("");

    try {
      await pipelineService.addCard(pipelineId, {
        leadId: pipelineLead.id,
        stageId,
      });

      setPipelineLead(null);
      notify("Lead adicionado ao Pipeline.");
    } catch (err) {
      const text =
        err instanceof Error
          ? err.message
          : "Erro ao adicionar ao Pipeline.";

      setPipelineMessage(
        text.includes("pipeline") ||
          text.includes("Pipeline")
          ? text
          : "Lead já está neste Pipeline ou a etapa não está disponível."
      );
    } finally {
      setBusyLeadId(undefined);
    }
  }

  return (
    <main className="space-y-6">
      <PageHeader
        title="Leads"
        description="Gerencie captação, classificação, atribuição e o histórico completo dos seus leads."
        action={
          <Button
            type="button"
            onClick={() => setFormLead(null)}
          >
            Novo Lead
          </Button>
        }
      />

      <LeadStats
        total={totalLeads}
        hot={hotLeads}
        contacted={contactedLeads}
        converted={convertedLeads}
      />

      {message && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      <Card>
  <SearchBar
    value={searchInput}
    placeholder="Busque por nome, telefone, e-mail ou CPF..."
    onChange={setSearchInput}
  />
</Card>

      <LeadFilters
        filters={filters}
        users={users}
        onChange={setFilters}
      />

      <LeadTable
        leads={leads}
        loading={loading}
        users={users}
        busyLeadId={busyLeadId}
        onView={(lead) =>
          setDrawerLeadId(lead.id)
        }
        onEdit={setFormLead}
        onArchive={setArchiveLead}
        onAddToPipeline={(lead) => {
          setPipelineMessage("");
          setPipelineLead(lead);
        }}
        onAssign={(lead, assignedUserId) =>
          void mutateLead(
            lead,
            () =>
              leadService.assign(
                lead.id,
                assignedUserId
              ),
            "Responsável atualizado."
          )
        }
        onStatus={(lead, value: LeadStatus) =>
          void mutateLead(
            lead,
            () =>
              leadService.updateStatus(
                lead.id,
                value
              ),
            "Status atualizado."
          )
        }
        onTemperature={(
          lead,
          value: LeadTemperature
        ) =>
          void mutateLead(
            lead,
            () =>
              leadService.updateTemperature(
                lead.id,
                value
              ),
            "Temperatura atualizada."
          )
        }
      />

      <Card padding="sm">
        <div className="flex flex-col gap-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>
            {meta.total} lead(s) • página {meta.page} de{" "}
            {meta.totalPages || 1}
          </span>

          <label className="flex items-center gap-2">
            <span>Itens por página</span>

            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              value={filters.limit ?? 10}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  page: 1,
                  limit: Number(event.target.value),
                })
              }
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={meta.page <= 1}
              onClick={() =>
                setFilters({
                  ...filters,
                  page: Math.max(
                    1,
                    (filters.page ?? 1) - 1
                  ),
                })
              }
            >
              Anterior
            </Button>

            <Button
              type="button"
              variant="secondary"
              disabled={
                meta.page >= meta.totalPages
              }
              onClick={() =>
                setFilters({
                  ...filters,
                  page: Math.min(
                    meta.totalPages,
                    (filters.page ?? 1) + 1
                  ),
                })
              }
            >
              Próxima
            </Button>
          </div>
        </div>
      </Card>

      {formLead !== undefined && (
        <LeadForm
          key={formLead?.id ?? "new"}
          lead={formLead}
          users={users}
          onCancel={() =>
            setFormLead(undefined)
          }
          onSuccess={(saved) => {
            setFormLead(undefined);

            setLeads((current) =>
              formLead?.id
                ? current.map((item) =>
                    item.id === saved.id
                      ? saved
                      : item
                  )
                : [saved, ...current]
            );

            void refresh(
              "Lead salvo com sucesso."
            );
          }}
        />
      )}

      {archiveLead && (
        <ArchiveLeadDialog
          lead={archiveLead}
          saving={
            busyLeadId === archiveLead.id
          }
          onCancel={() =>
            setArchiveLead(null)
          }
          onConfirm={() =>
            void confirmArchive()
          }
        />
      )}

      {pipelineLead && (
        <AddLeadToPipelineDialog
          lead={pipelineLead}
          pipelines={pipelines}
          saving={
            busyLeadId === pipelineLead.id
          }
          message={pipelineMessage}
          onCancel={() =>
            setPipelineLead(null)
          }
          onConfirm={(pipelineId, stageId) =>
            void addToPipeline(
              pipelineId,
              stageId
            )
          }
        />
      )}

      <LeadDrawer
        card={null}
        board={null}
        leadId={drawerLeadId}
        onClose={() =>
          setDrawerLeadId(null)
        }
        onArchived={() =>
          void refresh(
            "Lead arquivado com sucesso."
          )
        }
        onEdit={(lead) =>
          setFormLead(lead)
        }
      />
    </main>
  );
}