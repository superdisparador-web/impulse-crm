"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import OrganizationForm from "@/components/organizations/OrganizationForm";
import OrganizationTable from "@/components/organizations/OrganizationTable";
import { isGlobalAdmin } from "@/services/auth";
import { organizationService } from "@/services/organization.service";
import { Organization, OrganizationFormData } from "@/types/organization";

const PAGE_SIZE = 10;

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const canManageOrganizations = typeof window !== "undefined" && isGlobalAdmin();

  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await organizationService.getAll({ page, limit: PAGE_SIZE, search, active: active === "" ? "" : active === "true" });
      setOrganizations(response.items);
      setTotalPages(response.meta.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Não foi possível carregar as empresas."));
    } finally {
      setLoading(false);
    }
  }, [active, page, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrganizations();
  }, [loadOrganizations]);

  function openCreateForm() {
    if (!canManageOrganizations) return;
    setSelectedOrganization(null);
    setIsFormOpen(true);
  }

  function openEditForm(organization: Organization) {
    if (!canManageOrganizations) return;
    setSelectedOrganization(organization);
    setIsFormOpen(true);
  }

  async function handleSubmit(data: OrganizationFormData) {
    try {
      setSaving(true);
      if (selectedOrganization) {
        await organizationService.update(selectedOrganization.id, data);
      } else {
        await organizationService.create(data);
      }
      setIsFormOpen(false);
      setSuccess(selectedOrganization ? "Empresa atualizada com sucesso." : "Empresa criada com sucesso.");
      setError("");
      await loadOrganizations();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Não foi possível salvar a empresa."));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(organization: Organization) {
    if (!canManageOrganizations || saving) return;
    try {
      setSaving(true);
      const updated = await organizationService.updateStatus(organization.id, !organization.active);
      setSuccess(updated.active ? "Empresa ativada com sucesso." : "Empresa inativada com sucesso.");
      setError("");
      await loadOrganizations();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Não foi possível alterar o status da empresa."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(organization: Organization) {
    if (!canManageOrganizations || saving || !confirm(`Deseja excluir a empresa ${organization.name}?`)) {
      return;
    }

    try {
      await organizationService.delete(organization.id);
      setSuccess("Empresa excluída com sucesso.");
      setError("");
      await loadOrganizations();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Não foi possível excluir a empresa."));
    }
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Empresas</h1>
          <p className="mt-2 text-slate-400">Gerencie a base de organizações do Impulse CRM.</p>
        </div>
        {canManageOrganizations && <Button onClick={openCreateForm}>+ Nova Empresa</Button>}
      </div>

      {success && <p className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">{success}</p>}

      <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 md:grid-cols-[1fr_220px]">
        <Input label="Buscar" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Nome, documento, e-mail ou telefone" />
        <Select label="Status" value={active} onChange={(event) => { setPage(1); setActive(event.target.value); }} options={[{ label: "Todas", value: "" }, { label: "Ativas", value: "true" }, { label: "Inativas", value: "false" }]} />
      </div>

      <OrganizationTable organizations={organizations} loading={loading} error={error} canManage={canManageOrganizations} onEdit={openEditForm} onToggleStatus={handleToggleStatus} onDelete={handleDelete} />

      <div className="flex items-center justify-end gap-3">
        <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((currentPage) => currentPage - 1)}>Anterior</Button>
        <span className="text-sm text-slate-400">Página {page} de {totalPages}</span>
        <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((currentPage) => currentPage + 1)}>Próxima</Button>
      </div>

      {canManageOrganizations && <Modal isOpen={isFormOpen} title={selectedOrganization ? "Editar empresa" : "Nova empresa"} onClose={() => setIsFormOpen(false)} width="lg">
        <OrganizationForm organization={selectedOrganization} saving={saving} onCancel={() => setIsFormOpen(false)} onSubmit={handleSubmit} />
      </Modal>}
    </main>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
