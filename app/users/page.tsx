"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import UserForm from "@/components/users/UserForm";
import UserTable from "@/components/users/UserTable";
import { getCurrentUser, isGlobalAdmin } from "@/services/auth";
import { organizationService } from "@/services/organization.service";
import { userService } from "@/services/user.service";
import { Organization } from "@/types/organization";
import { User, UserFormData } from "@/types/user";

const PAGE_SIZE = 10;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const currentUser = useMemo(() => (typeof window === "undefined" ? null : getCurrentUser()), []);
  const globalAdmin = useMemo(() => (typeof window === "undefined" ? false : isGlobalAdmin()), []);
  const canManage = currentUser?.role === "ADMIN";

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      if (canManage) {
        const response = await userService.getAll({ page, limit: PAGE_SIZE, search, active: active === "" ? "" : active === "true" });
        setUsers(response.items);
        setTotalPages(response.meta.totalPages || 1);
      } else {
        const me = await userService.getMe();
        setUsers([me]);
        setTotalPages(1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar os usuários.");
    } finally {
      setLoading(false);
    }
  }, [active, canManage, page, search]);

  const loadOrganizations = useCallback(async () => {
    if (!globalAdmin) return;
    try {
      const response = await organizationService.getAll({ page: 1, limit: 100 });
      setOrganizations(response.items.filter((organization) => organization.active));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar as organizações.");
    }
  }, [globalAdmin]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadUsers(); }, [loadUsers]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadOrganizations(); }, [loadOrganizations]);

  function openCreateForm() { setSelectedUser(null); setIsFormOpen(true); setError(""); }
  function openEditForm(user: User) { setSelectedUser(user); setIsFormOpen(true); setError(""); }

  async function handleSubmit(data: UserFormData) {
    if (saving) return;
    try {
      setSaving(true); setSuccess(""); setError("");
      if (selectedUser) await userService.update(selectedUser.id, data); else await userService.create(data);
      setIsFormOpen(false);
      setSuccess(selectedUser ? "Usuário atualizado com sucesso." : "Usuário criado com sucesso.");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o usuário.");
    } finally { setSaving(false); }
  }

  async function handleStatus(user: User) {
    if (saving) return;
    try { setError(""); await userService.updateStatus(user.id, !user.active); setSuccess(user.active ? "Usuário desativado com sucesso." : "Usuário ativado com sucesso."); await loadUsers(); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível alterar o status do usuário."); }
  }

  async function handleDelete(user: User) {
    if (saving) return;
    if (!confirm(`Deseja excluir o usuário ${user.name}?`)) return;
    try { setError(""); await userService.delete(user.id); setSuccess("Usuário excluído com sucesso."); await loadUsers(); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível excluir o usuário."); }
  }

  async function handleResetPassword() {
    if (saving || !resetUser) return;
    if (newPassword.length < 6) { setError("A nova senha deve ter pelo menos 6 caracteres."); return; }
    try { setSaving(true); setError(""); await userService.resetPassword(resetUser.id, newPassword); setResetUser(null); setNewPassword(""); setSuccess("Senha resetada com sucesso."); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível resetar a senha."); }
    finally { setSaving(false); }
  }

  return <main className="space-y-6"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h1 className="text-4xl font-bold">Usuários</h1><p className="mt-2 text-slate-400">Gerencie usuários, permissões e status de acesso.</p></div>{canManage && <Button onClick={openCreateForm}>+ Novo usuário</Button>}</div>{success && <p className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">{success}</p>}{canManage && <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 md:grid-cols-[1fr_220px]"><Input label="Buscar por nome ou e-mail" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Digite nome ou e-mail" /><Select label="Status" value={active} onChange={(event) => { setPage(1); setActive(event.target.value); }} options={[{ label: "Todos", value: "" }, { label: "Ativos", value: "true" }, { label: "Inativos", value: "false" }]} /></div>}<div className="overflow-x-auto"><UserTable users={users} loading={loading} error={error} canManage={!!canManage} onEdit={openEditForm} onStatus={handleStatus} onDelete={handleDelete} onResetPassword={(user) => { setResetUser(user); setNewPassword(""); }} /></div>{canManage && <div className="flex items-center justify-end gap-3"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage((currentPage) => currentPage - 1)}>Anterior</Button><span className="text-sm text-slate-400">Página {page} de {totalPages}</span><Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((currentPage) => currentPage + 1)}>Próxima</Button></div>}<Modal isOpen={isFormOpen} title={selectedUser ? "Editar usuário" : "Novo usuário"} onClose={() => setIsFormOpen(false)} width="lg"><UserForm user={selectedUser} organizations={organizations} saving={saving} canAssignOrganizations={globalAdmin} canAssignRoles={globalAdmin} onCancel={() => setIsFormOpen(false)} onSubmit={handleSubmit} /></Modal><Modal isOpen={!!resetUser} title="Resetar senha" onClose={() => setResetUser(null)} width="md"><div className="space-y-4"><p className="text-sm text-slate-300">Defina uma nova senha para {resetUser?.name}.</p><Input label="Nova senha" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={6} /><div className="flex justify-end gap-3 border-t border-slate-700 pt-4"><Button variant="secondary" onClick={() => setResetUser(null)}>Cancelar</Button><Button onClick={handleResetPassword} disabled={saving}>{saving ? "Salvando..." : "Resetar senha"}</Button></div></div></Modal></main>;
}
