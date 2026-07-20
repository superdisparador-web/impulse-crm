"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import OrganizationForm from "@/components/organizations/OrganizationForm";
import OrganizationTable from "@/components/organizations/OrganizationTable";
import { organizationService } from "@/services/organization.service";
import { Organization, OrganizationFormData } from "@/types/organization";

const PAGE_SIZE = 10;

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await organizationService.getAll({ page, limit: PAGE_SIZE, search });
      setOrganizations(response.items);
      setTotalPages(response.meta.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar as empresas.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrganizations();
  }, [loadOrganizations]);

  function openCreateForm() {
    setSelectedOrganization(null);
    setIsFormOpen(true);
  }

  function openEditForm(organization: Organization) {
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
      await loadOrganizations();
    } catch (err) {
      console.error(err);
      setError("Não foi possível salvar a empresa.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(organization: Organization) {
    if (!confirm(`Deseja excluir a empresa ${organization.name}?`)) {
      return;
    }

    try {
      await organizationService.delete(organization.id);
      await loadOrganizations();
    } catch (err) {
      console.error(err);
      setError("Não foi possível excluir a empresa.");
    }
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Empresas</h1>
          <p className="mt-2 text-slate-400">Gerencie a base de organizações do Impulse CRM.</p>
        </div>
        <Button onClick={openCreateForm}>+ Nova Empresa</Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 md:flex-row md:items-end md:justify-between">
        <Input label="Buscar por nome" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Digite o nome da empresa" />
      </div>

      <OrganizationTable organizations={organizations} loading={loading} error={error} onEdit={openEditForm} onDelete={handleDelete} />

      <div className="flex items-center justify-end gap-3">
        <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((currentPage) => currentPage - 1)}>Anterior</Button>
        <span className="text-sm text-slate-400">Página {page} de {totalPages}</span>
        <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((currentPage) => currentPage + 1)}>Próxima</Button>
      </div>

      <Modal isOpen={isFormOpen} title={selectedOrganization ? "Editar empresa" : "Nova empresa"} onClose={() => setIsFormOpen(false)} width="lg">
        <OrganizationForm organization={selectedOrganization} saving={saving} onCancel={() => setIsFormOpen(false)} onSubmit={handleSubmit} />
      </Modal>
    </main>
  );
}
