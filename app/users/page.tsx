"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import UserForm from "@/components/users/UserForm";
import UserTable from "@/components/users/UserTable";
import { organizationService } from "@/services/organization.service";
import { userService } from "@/services/user.service";
import { Organization } from "@/types/organization";
import { User, UserFormData } from "@/types/user";

const PAGE_SIZE = 10;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]); const [organizations, setOrganizations] = useState<Organization[]>([]); const [selectedUser, setSelectedUser] = useState<User | null>(null); const [search, setSearch] = useState(""); const [active, setActive] = useState(""); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const [isFormOpen, setIsFormOpen] = useState(false);

  const loadUsers = useCallback(async () => { try { setLoading(true); setError(""); const response = await userService.getAll({ page, limit: PAGE_SIZE, search, active: active === "" ? "" : active === "true" }); setUsers(response.items); setTotalPages(response.meta.totalPages || 1); } catch (err) { console.error(err); setError("Não foi possível carregar os usuários."); } finally { setLoading(false); } }, [page, search, active]);
  const loadOrganizations = useCallback(async () => { try { const response = await organizationService.getAll({ page: 1, limit: 100 }); setOrganizations(response.items.filter((organization) => organization.active)); } catch (err) { console.error(err); setError("Não foi possível carregar as organizações."); } }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadUsers(); }, [loadUsers]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadOrganizations(); }, [loadOrganizations]);

  function openCreateForm() { setSelectedUser(null); setIsFormOpen(true); }
  function openEditForm(user: User) { setSelectedUser(user); setIsFormOpen(true); }
  async function handleSubmit(data: UserFormData) { try { setSaving(true); setSuccess(""); if (selectedUser) await userService.update(selectedUser.id, data); else await userService.create(data); setIsFormOpen(false); setSuccess(selectedUser ? "Usuário atualizado com sucesso." : "Usuário criado com sucesso."); await loadUsers(); } catch (err) { console.error(err); setError("Não foi possível salvar o usuário."); } finally { setSaving(false); } }
  async function handleStatus(user: User) { try { await userService.updateStatus(user.id, !user.active); setSuccess(user.active ? "Usuário desativado com sucesso." : "Usuário ativado com sucesso."); await loadUsers(); } catch (err) { console.error(err); setError("Não foi possível alterar o status do usuário."); } }
  async function handleDelete(user: User) { if (!confirm(`Deseja excluir o usuário ${user.name}?`)) return; try { await userService.delete(user.id); setSuccess("Usuário excluído com sucesso."); await loadUsers(); } catch (err) { console.error(err); setError("Não foi possível excluir o usuário."); } }

  return <main className="space-y-6"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h1 className="text-4xl font-bold">Usuários</h1><p className="mt-2 text-slate-400">Gerencie usuários, organizações, papéis e status de acesso.</p></div><Button onClick={openCreateForm}>+ Novo usuário</Button></div>{success && <p className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">{success}</p>}<div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 md:grid-cols-[1fr_220px]"><Input label="Buscar por nome ou e-mail" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Digite nome ou e-mail" /><Select label="Status" value={active} onChange={(event) => { setPage(1); setActive(event.target.value); }} options={[{ label: "Todos", value: "" }, { label: "Ativos", value: "true" }, { label: "Inativos", value: "false" }]} /></div><div className="overflow-x-auto"><UserTable users={users} loading={loading} error={error} onEdit={openEditForm} onStatus={handleStatus} onDelete={handleDelete} /></div><div className="flex items-center justify-end gap-3"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage((currentPage) => currentPage - 1)}>Anterior</Button><span className="text-sm text-slate-400">Página {page} de {totalPages}</span><Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((currentPage) => currentPage + 1)}>Próxima</Button></div><Modal isOpen={isFormOpen} title={selectedUser ? "Editar usuário" : "Novo usuário"} onClose={() => setIsFormOpen(false)} width="lg"><UserForm user={selectedUser} organizations={organizations} saving={saving} onCancel={() => setIsFormOpen(false)} onSubmit={handleSubmit} /></Modal></main>;
}
