"use client";

import { useCallback, useEffect, useState } from "react";
import LeadDetails from "@/components/leads/LeadDetails";
import LeadFilters from "@/components/leads/LeadFilters";
import LeadForm from "@/components/leads/LeadForm";
import LeadTable from "@/components/leads/LeadTable";
import { leadService } from "@/services/lead.service";
import { organizationService } from "@/services/organization.service";
import { userService } from "@/services/user.service";
import { Lead, LeadListParams, LeadStatus, LeadTemperature } from "@/types/lead";
import { Organization } from "@/types/organization";
import { User } from "@/types/user";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<LeadListParams>({
    page: 1,
    limit: 10,
    order: "desc",
  });
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formLead, setFormLead] = useState<Lead | null | undefined>();
  const [detailLead, setDetailLead] = useState<Lead | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [leadData, orgData, userData] = await Promise.all([
        leadService.getAll(filters),
        organizationService.getAll({ limit: 100 }),
        userService.getAll({ limit: 100, active: true }),
      ]);

      setLeads(leadData.items);
      setMeta(leadData.meta);
      setOrganizations(orgData.items);
      setUsers(userData.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar leads.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [load]);

  async function refresh(text: string) {
    setMessage(text);
    await load();
    window.setTimeout(() => setMessage(""), 3000);
  }

  async function view(lead: Lead) {
    try {
      setDetailLead(await leadService.getById(lead.id));
    } catch {
      setError("Erro ao carregar detalhes.");
    }
  }

  async function remove(lead: Lead) {
    if (!window.confirm(`Excluir o lead ${lead.name || "lead sem nome"}?`)) return;

    await leadService.delete(lead.id);
    await refresh("Lead excluído com sucesso.");
  }

  async function assign(lead: Lead, assignedUserId: string | null) {
    await leadService.assign(lead.id, assignedUserId);
    await refresh("Responsável atualizado.");
  }

  async function status(lead: Lead, value: LeadStatus) {
    await leadService.updateStatus(lead.id, value);
    await refresh("Status atualizado.");
  }

  async function temperature(lead: Lead, value: LeadTemperature) {
    await leadService.updateTemperature(lead.id, value);
    await refresh("Temperatura atualizada.");
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Leads</h1>
          <p className="mt-2 text-slate-400">
            Gerencie captação, classificação e atribuição inicial de leads.
          </p>
        </div>
        <button
          onClick={() => setFormLead(null)}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700"
        >
          Novo lead
        </button>
      </div>

      {message && (
        <div className="rounded-lg border border-green-800 bg-green-950/50 p-3 text-green-200">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-red-200">
          {error}
        </div>
      )}

      <input
        className="w-full rounded-xl border border-slate-700 bg-slate-900 p-4 outline-none focus:border-blue-500"
        placeholder="Buscar por nome, telefone, e-mail ou documento..."
        value={filters.search ?? ""}
        onChange={(e) =>
          setFilters({ ...filters, page: 1, search: e.target.value })
        }
      />

      <LeadFilters
        filters={filters}
        organizations={organizations}
        users={users}
        onChange={setFilters}
      />

      <LeadTable
        leads={leads}
        loading={loading}
        users={users}
        onView={view}
        onEdit={setFormLead}
        onDelete={remove}
        onAssign={assign}
        onStatus={status}
        onTemperature={temperature}
      />

      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          {meta.total} lead(s) • página {meta.page} de {meta.totalPages || 1}
        </span>
        <div className="flex gap-2">
          <button
            disabled={meta.page <= 1}
            onClick={() =>
              setFilters({ ...filters, page: (filters.page ?? 1) - 1 })
            }
            className="rounded bg-slate-800 px-3 py-2 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            disabled={meta.page >= meta.totalPages}
            onClick={() =>
              setFilters({ ...filters, page: (filters.page ?? 1) + 1 })
            }
            className="rounded bg-slate-800 px-3 py-2 disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      </div>

      {formLead !== undefined && (
        <LeadForm
          key={formLead?.id ?? "new"}
          lead={formLead}
          organizations={organizations}
          users={users}
          onCancel={() => setFormLead(undefined)}
          onSuccess={() => {
            setFormLead(undefined);
            void refresh("Lead salvo com sucesso.");
          }}
        />
      )}

      {detailLead && (
        <LeadDetails lead={detailLead} onClose={() => setDetailLead(null)} />
      )}
    </main>
  );
}
