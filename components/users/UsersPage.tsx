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

type UsersPageMode = "users" | "corretores";

interface UsersPageProps {
  mode: UsersPageMode;
}

export default function UsersPage({ mode }: UsersPageProps) {
  const isCorretoresPage = mode === "corretores";

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

  const currentUser = useMemo(
    () => (typeof window === "undefined" ? null : getCurrentUser()),
    [],
  );

  const globalAdmin = useMemo(
    () => (typeof window === "undefined" ? false : isGlobalAdmin()),
    [],
  );

  const canManage = currentUser?.role === "ADMIN";

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!canManage) {
        const me = await userService.getMe();

        if (isCorretoresPage && me.role !== "CORRETOR") {
          setUsers([]);
        } else {
          setUsers([me]);
        }

        setTotalPages(1);
        return;
      }

      if (isCorretoresPage) {
        const response = await userService.getAll({
          page: 1,
          limit: 1000,
          search,
          active: active === "" ? "" : active === "true",
        });

        const corretores = response.items.filter(
          (user) => user.role === "CORRETOR",
        );

        const calculatedTotalPages = Math.max(
          1,
          Math.ceil(corretores.length / PAGE_SIZE),
        );

        const safePage = Math.min(page, calculatedTotalPages);
        const start = (safePage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;

        setUsers(corretores.slice(start, end));
        setTotalPages(calculatedTotalPages);

        if (safePage !== page) {
          setPage(safePage);
        }

        return;
      }

      const response = await userService.getAll({
        page,
        limit: PAGE_SIZE,
        search,
        active: active === "" ? "" : active === "true",
      });

      setUsers(response.items);
      setTotalPages(response.meta.totalPages || 1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isCorretoresPage
            ? "Não foi possível carregar os corretores."
            : "Não foi possível carregar os usuários.",
      );
    } finally {
      setLoading(false);
    }
  }, [active, canManage, isCorretoresPage, page, search]);

  const loadOrganizations = useCallback(async () => {
    if (!globalAdmin) return;

    try {
      const response = await organizationService.getAll({
        page: 1,
        limit: 100,
      });

      setOrganizations(
        response.items.filter((organization) => organization.active),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar as organizações.",
      );
    }
  }, [globalAdmin]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void loadOrganizations();
  }, [loadOrganizations]);

  function openCreateForm() {
    setSelectedUser(null);
    setIsFormOpen(true);
    setError("");
    setSuccess("");
  }

  function openEditForm(user: User) {
    setSelectedUser(user);
    setIsFormOpen(true);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(data: UserFormData) {
    if (saving) return;

    const payload: UserFormData = isCorretoresPage
      ? {
          ...data,
          role: "CORRETOR",
        }
      : data;

    try {
      setSaving(true);
      setSuccess("");
      setError("");

      if (selectedUser) {
        await userService.update(selectedUser.id, payload);
      } else {
        await userService.create(payload);
      }

      setIsFormOpen(false);
      setSelectedUser(null);

      setSuccess(
        selectedUser
          ? isCorretoresPage
            ? "Corretor atualizado com sucesso."
            : "Usuário atualizado com sucesso."
          : isCorretoresPage
            ? "Corretor criado com sucesso."
            : "Usuário criado com sucesso.",
      );

      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isCorretoresPage
            ? "Não foi possível salvar o corretor."
            : "Não foi possível salvar o usuário.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(user: User) {
    if (saving) return;

    try {
      setError("");
      setSuccess("");

      await userService.updateStatus(user.id, !user.active);

      setSuccess(
        user.active
          ? isCorretoresPage
            ? "Corretor desativado com sucesso."
            : "Usuário desativado com sucesso."
          : isCorretoresPage
            ? "Corretor ativado com sucesso."
            : "Usuário ativado com sucesso.",
      );

      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isCorretoresPage
            ? "Não foi possível alterar o status do corretor."
            : "Não foi possível alterar o status do usuário.",
      );
    }
  }

  async function handleDelete(user: User) {
    if (saving) return;

    const itemName = isCorretoresPage ? "corretor" : "usuário";

    if (!confirm(`Deseja excluir o ${itemName} ${user.name}?`)) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await userService.delete(user.id);

      setSuccess(
        isCorretoresPage
          ? "Corretor excluído com sucesso."
          : "Usuário excluído com sucesso.",
      );

      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isCorretoresPage
            ? "Não foi possível excluir o corretor."
            : "Não foi possível excluir o usuário.",
      );
    }
  }

  async function handleResetPassword() {
    if (saving || !resetUser) return;

    if (newPassword.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await userService.resetPassword(resetUser.id, newPassword);

      setResetUser(null);
      setNewPassword("");
      setSuccess("Senha resetada com sucesso.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível resetar a senha.",
      );
    } finally {
      setSaving(false);
    }
  }

  const title = isCorretoresPage ? "Corretores" : "Usuários";

  const description = isCorretoresPage
    ? "Gerencie os corretores responsáveis pelo atendimento e distribuição dos leads."
    : "Gerencie usuários, permissões e status de acesso.";

  const createButtonText = isCorretoresPage
    ? "+ Novo corretor"
    : "+ Novo usuário";

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold">{title}</h1>

          <p className="mt-2 text-slate-400">{description}</p>
        </div>

        {canManage && (
          <Button onClick={openCreateForm}>{createButtonText}</Button>
        )}
      </div>

      {success && (
        <p className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">
          {success}
        </p>
      )}

      {canManage && (
        <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 md:grid-cols-[1fr_220px]">
          <Input
            label="Buscar por nome ou e-mail"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Digite nome ou e-mail"
          />

          <Select
            label="Status"
            value={active}
            onChange={(event) => {
              setPage(1);
              setActive(event.target.value);
            }}
            options={[
              { label: "Todos", value: "" },
              { label: "Ativos", value: "true" },
              { label: "Inativos", value: "false" },
            ]}
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <UserTable
          users={users}
          loading={loading}
          error={error}
          canManage={!!canManage}
          onEdit={openEditForm}
          onStatus={handleStatus}
          onDelete={handleDelete}
          onResetPassword={(user) => {
            setResetUser(user);
            setNewPassword("");
            setError("");
            setSuccess("");
          }}
        />
      </div>

      {canManage && (
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((currentPage) => currentPage - 1)}
          >
            Anterior
          </Button>

          <span className="text-sm text-slate-400">
            Página {page} de {totalPages}
          </span>

          <Button
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((currentPage) => currentPage + 1)}
          >
            Próxima
          </Button>
        </div>
      )}

      <Modal
        isOpen={isFormOpen}
        title={
          selectedUser
            ? isCorretoresPage
              ? "Editar corretor"
              : "Editar usuário"
            : isCorretoresPage
              ? "Novo corretor"
              : "Novo usuário"
        }
        onClose={() => setIsFormOpen(false)}
        width="lg"
      >
        <UserForm
          key={selectedUser?.id ?? "new-user"}
          user={selectedUser}
          organizations={organizations}
          saving={saving}
          canAssignOrganizations={globalAdmin}
          canAssignRoles={isCorretoresPage ? false : globalAdmin}
          onCancel={() => setIsFormOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>

      <Modal
        isOpen={!!resetUser}
        title="Resetar senha"
        onClose={() => setResetUser(null)}
        width="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Defina uma nova senha para {resetUser?.name}.
          </p>

          <Input
            label="Nova senha"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            minLength={6}
          />

          <div className="flex justify-end gap-3 border-t border-slate-700 pt-4">
            <Button variant="secondary" onClick={() => setResetUser(null)}>
              Cancelar
            </Button>

            <Button onClick={handleResetPassword} disabled={saving}>
              {saving ? "Salvando..." : "Resetar senha"}
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
