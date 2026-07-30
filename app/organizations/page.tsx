"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, BuildingIcon, Plus, Search, UsersRound } from "lucide-react";
import OrganizationForm from "@/components/organizations/OrganizationForm";
import OrganizationTable from "@/components/organizations/OrganizationTable";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import Select from "@/components/ui/Select";
import StatCard from "@/components/ui/StatCard";
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
  const [total, setTotal] = useState(0);
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
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Não foi possível carregar as empresas."));
    } finally {
      setLoading(false);
    }
  }, [active, page, search]);

  useEffect(() => { const timer = window.setTimeout(() => void loadOrganizations(), 0); return () => window.clearTimeout(timer); }, [loadOrganizations]);

  const pageMetrics = useMemo(() => ({
    active: organizations.filter((organization) => organization.active).length,
    inactive: organizations.filter((organization) => !organization.active).length,
    users: organizations.reduce((sum, organization) => sum + (organization._count?.users ?? 0), 0),
  }), [organizations]);

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
      if (selectedOrganization) await organizationService.update(selectedOrganization.id, data);
      else await organizationService.create(data);
      setIsFormOpen(false);
      setSuccess(selectedOrganization ? "Empresa atualizada com sucesso." : "Empresa criada com sucesso.");
      setError("");
      await loadOrganizations();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, "Não foi possível salvar a empresa."));
    } finally { setSaving(false); }
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
    } finally { setSaving(false); }
  }

  async function handleDelete(organization: Organization) {
    if (!canManageOrganizations || saving || !confirm(`Deseja excluir a empresa ${organization.name}?`)) return;
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
    <main className="space-y-6 text-slate-900">
      <PageHeader
        title="Empresas"
        description="Gerencie as organizações, seus acessos e a operação no Impulse CRM."
        action={canManageOrganizations ? <Button size="lg" onClick={openCreateForm}><Plus size={18} />Nova Empresa</Button> : undefined}
      />

      {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores de empresas">
        <StatCard title="Total de empresas" value={total} icon={<Building2 size={22} />} />
        <StatCard title="Ativas nesta página" value={pageMetrics.active} icon={<BuildingIcon size={22} />} />
        <StatCard title="Inativas nesta página" value={pageMetrics.inactive} icon={<BuildingIcon size={22} />} />
        <StatCard title="Usuários nesta página" value={pageMetrics.users} icon={<UsersRound size={22} />} />
      </section>

      <Card padding="md">
        <div className="grid items-end gap-4 md:grid-cols-[minmax(280px,1fr)_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute bottom-3.5 left-4 z-10 text-slate-400" size={18} />
            <Input label="Buscar empresa" className="bg-white pl-11" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Nome, documento, e-mail ou telefone" />
          </div>
          <Select label="Status" className="bg-white" value={active} onChange={(event) => { setPage(1); setActive(event.target.value); }} options={[{ label: "Todas as empresas", value: "" }, { label: "Ativas", value: "true" }, { label: "Inativas", value: "false" }]} />
        </div>
      </Card>

      <OrganizationTable organizations={organizations} loading={loading} error={error} canManage={canManageOrganizations} onCreate={openCreateForm} onEdit={openEditForm} onToggleStatus={handleToggleStatus} onDelete={handleDelete} />

      <div className="flex flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row">
        <span>{total} empresa(s) • página {page} de {totalPages}</span>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((currentPage) => currentPage - 1)}>Anterior</Button>
          <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((currentPage) => currentPage + 1)}>Próxima</Button>
        </div>
      </div>

      {canManageOrganizations && (
        <Modal isOpen={isFormOpen} title={selectedOrganization ? "Editar empresa" : "Nova empresa"} onClose={() => setIsFormOpen(false)} width="lg">
          <OrganizationForm organization={selectedOrganization} saving={saving} onCancel={() => setIsFormOpen(false)} onSubmit={handleSubmit} />
        </Modal>
      )}
    </main>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
