"use client";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Check,
  Clipboard,
  Clock3,
  Eye,
  EyeOff,
  Download,
  KeyRound,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import UserForm, {
  generateTemporaryPassword,
  getPasswordStrength,
} from "./UserForm";
import UserTable from "./UserTable";
import BrokersEnterprise from "./BrokersEnterprise";
import { getCurrentUser, isGlobalAdmin } from "@/services/auth";
import { organizationService } from "@/services/organization.service";
import { userService } from "@/services/user.service";
import { Organization } from "@/types/organization";
import { User, UserFormData, UserMetrics, UserRole } from "@/types/user";
const PAGE_SIZE = 10;
const emptyMetrics: UserMetrics = {
  total: 0,
  active: 0,
  inactive: 0,
  administrators: 0,
  managers: 0,
  brokers: 0,
};
export default function UsersPage({ mode }: { mode: "users" | "corretores" }) {
  const brokers = mode === "corretores";
  const current = useMemo(() => getCurrentUser(), []);
  const global = isGlobalAdmin();
  const authorized =
    !!current && !["CORRETOR", "BROKER"].includes(current.role);
  const canManage = authorized;
  const roles: UserRole[] = global
    ? ["GLOBAL_ADMIN", "ORG_ADMIN", "MANAGER", "BROKER"]
    : current?.role === "MANAGER"
      ? ["BROKER"]
      : ["MANAGER", "BROKER"];
  const [referenceTime] = useState(() => Date.now());
  const [users, setUsers] = useState<User[]>([]),
    [organizations, setOrganizations] = useState<Organization[]>([]);
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [search, setSearch] = useState(""),
    [debounced, setDebounced] = useState(""),
    [active, setActive] = useState(""),
    [role, setRole] = useState(""),
    [organizationId, setOrganizationId] = useState(""),
    [createdPeriod, setCreatedPeriod] = useState("");
  const [page, setPage] = useState(1),
    [pages, setPages] = useState(1),
    [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(authorized),
    [saving, setSaving] = useState(false);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [form, setForm] = useState<User | null | undefined>(undefined),
    [view, setView] = useState<User | null>(null),
    [reset, setReset] = useState<User | null>(null),
    [password, setPassword] = useState(""),
    [status, setStatus] = useState<User | null>(null),
    [archive, setArchive] = useState<User | null>(null),
    [remove, setRemove] = useState<User | null>(null);
  const requestSequence = useRef(0);
  const inFlight = useRef(false);
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (search === debounced) return;

      setLoading(true);
      setDebounced(search);
      setPage(1);
    }, 350);

    return () => window.clearTimeout(id);
  }, [search, debounced]);
  const loadUsers = useCallback(
    async (force = false) => {
      await Promise.resolve();
      if (!authorized || (!force && inFlight.current)) return;
      const requestId = ++requestSequence.current;
      inFlight.current = true;
      try {
        setError("");
        const query = {
          page,
          limit: PAGE_SIZE,
          search: debounced,
          active: active === "" ? ("" as const) : active === "true",
          role: (role || undefined) as UserRole | undefined,
          organizationId: organizationId || undefined,
        };
        const list = await userService.getAll(query);

        let summary = emptyMetrics;

        if (!brokers) {
          summary = await userService.getMetrics({
            organizationId: organizationId || undefined,
          });
        }

        if (requestId !== requestSequence.current) return;

        setUsers(
          brokers
            ? list.items.filter((u) => ["CORRETOR", "BROKER"].includes(u.role))
            : list.items,
        );
        setPages(list.meta.totalPages || 1);
        setTotal(list.meta.total);

        if (!brokers) {
          setMetrics(summary);
        }
      } catch (e) {
        if (requestId === requestSequence.current)
          setError(
            e instanceof Error
              ? e.message
              : "Não foi possível carregar os usuários.",
          );
      } finally {
        inFlight.current = false;
        setLoading(false);
      }
    },
    [active, authorized, brokers, debounced, organizationId, page, role],
  );
  useEffect(() => {
    let cancelled = false;
    async function synchronize() {
      await loadUsers(true);
      if (cancelled) requestSequence.current += 1;
    }
    void synchronize();
    return () => {
      cancelled = true;
      requestSequence.current += 1;
      inFlight.current = false;
    };
  }, [loadUsers]);
  useEffect(() => {
    if (!brokers || !authorized) return;
    const intervalId = window.setInterval(() => void loadUsers(), 60_000);
    return () => window.clearInterval(intervalId);
  }, [authorized, brokers, loadUsers]);
  useEffect(() => {
    if (!global) return;
    let cancelled = false;
    async function loadOrganizations() {
      const response = await organizationService.getAll({
        page: 1,
        limit: 100,
      });
      if (!cancelled) setOrganizations(response.items.filter((o) => o.active));
    }
    void loadOrganizations().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [global]);
  function openCreateForm() {
    setForm(null);
  }
  function openEditForm(user: User) {
    setForm(user);
  }
  async function handleSubmit(data: UserFormData) {
    try {
      setSaving(true);
      if (form) await userService.update(form.id, data);
      else
        await userService.create(brokers ? { ...data, role: "BROKER" } : data);
      setForm(undefined);
      setNotice(
        form
          ? "Usuário atualizado com sucesso."
          : "Usuário criado com sucesso.",
      );
      await loadUsers();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível salvar o usuário.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function handleStatus() {
    if (!status) return;
    try {
      setSaving(true);
      await userService.updateStatus(status.id, !status.active);
      setNotice(
        status.active
          ? "Usuário desativado com segurança."
          : "Usuário ativado com sucesso.",
      );
      setStatus(null);
      await loadUsers();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível alterar o acesso.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function handleArchive() {
    if (!archive) return;
    try {
      setSaving(true);
      await userService.delete(archive.id);
      setArchive(null);
      setNotice("Usuário arquivado. Os dados históricos foram preservados.");
      await loadUsers(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível arquivar o usuário.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function handleDelete() {
    if (!remove) return;
    try {
      setSaving(true);
      await userService.delete(remove.id);
      setRemove(null);
      setNotice("Usuário excluído com sucesso.");
      await loadUsers(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível excluir o usuário.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function handleResetPassword() {
    if (!reset || password.length < 8) {
      setError("A nova senha deve ter ao menos 8 caracteres.");
      return;
    }
    try {
      setSaving(true);
      await userService.resetPassword(reset.id, password);
      setReset(null);
      setPassword("");
      setNotice("Senha redefinida e sessões persistidas revogadas.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível redefinir a senha.",
      );
    } finally {
      setSaving(false);
    }
  }
  if (brokers)
    return (
      <>
        {notice && (
          <p
            role="status"
            className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {notice}
          </p>
        )}
        <BrokersEnterprise
          users={users}
          loading={loading}
          error={
            error ||
            (!authorized
              ? "Seu perfil não possui acesso à Central de Usuários."
              : "")
          }
          canManage={canManage}
          onRetry={loadUsers}
          onCreate={openCreateForm}
          onEdit={openEditForm}
          onStatus={setStatus}
          onResetPassword={(user) => {
            setReset(user);
            setPassword("");
          }}
        />
        <Modal
          isOpen={form !== undefined}
          title={form ? "Editar corretor" : "Novo corretor"}
          onClose={() => setForm(undefined)}
          width="lg"
        >
          <UserForm
            user={form}
            organizations={organizations}
            saving={saving}
            canAssignOrganizations={global}
            allowedRoles={["BROKER"]}
            onCancel={() => setForm(undefined)}
            onSubmit={handleSubmit}
          />
        </Modal>
        <StatusModal
          user={status}
          saving={saving}
          onClose={() => setStatus(null)}
          onConfirm={handleStatus}
        />
        <PasswordModal
          user={reset}
          password={password}
          saving={saving}
          onPassword={setPassword}
          onClose={() => setReset(null)}
          onConfirm={handleResetPassword}
        />
      </>
    );
  const today = new Date().toISOString().slice(0, 10);
  const visibleUsers = users.filter(
    (user) =>
      !createdPeriod ||
      new Date(user.createdAt) >=
        new Date(referenceTime - Number(createdPeriod) * 86_400_000),
  );
  const organizationOptions = organizations.length
    ? organizations
    : Array.from(
        new Map(
          users.flatMap((user) =>
            user.organization
              ? [[user.organization.id, user.organization]]
              : [],
          ),
        ).values(),
      );
  const accessesToday = users.filter(
    (user) => user.lastLoginAt?.slice(0, 10) === today,
  ).length;
  const permissionModules = [
    "Dashboard",
    "Leads",
    "Campanhas",
    "WhatsApp",
    "Analytics",
    "Relatórios",
    "Organizações",
    "Usuários",
    "Configurações",
  ];
  const cards = [
    [
      "Total de usuários",
      metrics.total,
      UsersRound,
      "bg-blue-50 text-blue-600",
    ],
    ["Ativos", metrics.active, UserCheck, "bg-emerald-50 text-emerald-600"],
    ["Inativos", metrics.inactive, Activity, "bg-slate-100 text-slate-600"],
    [
      "Administradores",
      metrics.administrators,
      ShieldCheck,
      "bg-violet-50 text-violet-600",
    ],
    ["Corretores", metrics.brokers, UserCheck, "bg-cyan-50 text-cyan-600"],
    ["Gerentes", metrics.managers, UsersRound, "bg-amber-50 text-amber-600"],
    [
      "Últimos acessos hoje",
      accessesToday,
      Clock3,
      "bg-indigo-50 text-indigo-600",
    ],
  ] as const;
  function exportCsv() {
    const cell = (value: unknown) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      [
        "Nome",
        "Email",
        "Telefone",
        "Cargo",
        "Organização",
        "Status",
        "Último acesso",
        "Criado em",
      ],
      ...visibleUsers.map((u) => [
        u.name,
        u.email,
        u.phone,
        u.title || u.role,
        u.organization?.name,
        u.active ? "Ativo" : "Inativo",
        u.lastLoginAt,
        u.createdAt,
      ]),
    ];
    const blob = new Blob(
      ["\ufeff" + rows.map((row) => row.map(cell).join(";")).join("\n")],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `usuarios-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <main className="space-y-6 pb-12">
      <PageHeader
        title="Central de Usuários"
        description="Gerencie acessos, equipes, funções e segurança da sua operação."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={exportCsv}
              disabled={!users.length}
            >
              <Download size={16} />
              Exportar
            </Button>
            <Button
              variant="secondary"
              aria-label="Atualizar lista"
              onClick={() => {
                setLoading(true);
                void loadUsers(true);
              }}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Atualizar
            </Button>
            {canManage && (
              <Button onClick={() => setForm(null)}>
                <UserPlus className="h-4 w-4" />
                Novo usuário
              </Button>
            )}
          </div>
        }
      />
      {notice && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}
      <section
        aria-label="Indicadores de usuários"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7"
      >
        {cards.map(([label, value, Icon, color]) => (
          <Card key={label} padding="sm">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm text-slate-500">{label}</p>
            <p className="mt-1 truncate text-xl font-bold text-slate-900">
              {loading ? "—" : value}
            </p>
          </Card>
        ))}
      </section>
      <Card>
        <div className="grid gap-4 xl:grid-cols-[minmax(240px,1fr)_170px_180px_210px_190px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-10 h-4 w-4 text-slate-400" />
            <Input
              className="pl-10"
              label="Pesquisa"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome, e-mail ou telefone"
            />
          </div>
          <Select
            label="Papel"
            value={role}
            onChange={(e) => {
              setLoading(true);
              setRole(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "", label: "Todos os papéis" },
              ...roles.map((r) => ({
                value: r,
                label:
                  r === "MANAGER"
                    ? "Gerente"
                    : r.includes("ADMIN")
                      ? "Administrador"
                      : "Corretor",
              })),
            ]}
          />
          <Select
            label="Status"
            value={active}
            onChange={(e) => {
              setLoading(true);
              setActive(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "", label: "Todos os status" },
              { value: "true", label: "Ativos" },
              { value: "false", label: "Inativos" },
            ]}
          />
          <Select
            label="Organização"
            value={organizationId}
            onChange={(e) => {
              setLoading(true);
              setOrganizationId(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "", label: "Todas as organizações" },
              ...organizationOptions.map((o) => ({
                value: o.id,
                label: o.name,
              })),
            ]}
          />
          <Select
            label="Data de criação"
            value={createdPeriod}
            onChange={(e) => setCreatedPeriod(e.target.value)}
            options={[
              { value: "", label: "Qualquer data" },
              { value: "1", label: "Hoje" },
              { value: "7", label: "Últimos 7 dias" },
              { value: "30", label: "Últimos 30 dias" },
            ]}
          />
          <Button
            className="self-end"
            variant="ghost"
            onClick={() => {
              setLoading(true);
              setSearch("");
              setActive("");
              setRole("");
              setOrganizationId("");
              setCreatedPeriod("");
              setPage(1);
            }}
          >
            <X size={16} />
            Limpar filtros
          </Button>
        </div>
      </Card>
      <UserTable
        users={visibleUsers}
        loading={loading}
        error={
          error ||
          (!authorized
            ? "Seu perfil não possui acesso à Central de Usuários."
            : "")
        }
        canManage={canManage}
        onRetry={loadUsers}
        onCreate={openCreateForm}
        onView={setView}
        onEdit={openEditForm}
        onStatus={setStatus}
        onResetPassword={(u) => {
          setReset(u);
          setPassword("");
        }}
        onArchive={setArchive}
        onDelete={setRemove}
      />
      <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {total} usuário(s) · Página {page} de {pages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => {
              setLoading(true);
              setPage((p) => p - 1);
            }}
          >
            Anterior
          </Button>
          <Button
            variant="secondary"
            disabled={page >= pages}
            onClick={() => {
              setLoading(true);
              setPage((p) => p + 1);
            }}
          >
            Próxima
          </Button>
        </div>
      </div>
      <Modal
        isOpen={form !== undefined}
        title={form ? "Editar usuário" : "Novo usuário"}
        onClose={() => setForm(undefined)}
        width="lg"
      >
        <UserForm
          user={form}
          organizations={organizations}
          saving={saving}
          canAssignOrganizations={global}
          allowedRoles={roles}
          onCancel={() => setForm(undefined)}
          onSubmit={handleSubmit}
        />
      </Modal>
      {view && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/25 backdrop-blur-[2px]"
          onClick={() => setView(null)}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard do usuário"
            className="broker-drawer absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Dashboard do usuário
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Perfil e acesso
                </h2>
              </div>
              <Button
                variant="ghost"
                aria-label="Fechar painel"
                onClick={() => setView(null)}
              >
                <X size={20} />
              </Button>
            </div>
            <div className="space-y-6 p-6">
              <div className="flex items-center gap-4">
                <span className="relative h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
                  <Image
                    src={view.avatarUrl || "/branding/impulse-helmet.png"}
                    alt={`Foto de ${view.name}`}
                    fill
                    sizes="80px"
                    unoptimized={Boolean(view.avatarUrl)}
                    className="object-cover"
                  />
                </span>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {view.name}
                  </h3>
                  <p className="text-slate-500">{view.title || view.role}</p>
                  <Badge
                    className="mt-2"
                    variant={view.active ? "success" : "neutral"}
                  >
                    {view.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
              <dl className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Telefone", view.phone || "Não informado"],
                  ["E-mail", view.email],
                  ["Organização", view.organization?.name || "Escopo global"],
                  ["Função", view.role],
                  [
                    "Data de criação",
                    new Intl.DateTimeFormat("pt-BR").format(
                      new Date(view.createdAt),
                    ),
                  ],
                  [
                    "Último login",
                    view.lastLoginAt
                      ? new Intl.DateTimeFormat("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(view.lastLoginAt))
                      : "Nunca",
                  ],
                  ["Último IP", view.lastLoginIp || "Não registrado"],
                  [
                    "Atualizado em",
                    new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(view.updatedAt)),
                  ],
                ].map(([term, value]) => (
                  <div
                    key={term}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <dt className="text-xs font-medium text-slate-500">
                      {term}
                    </dt>
                    <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div>
                <h4 className="font-semibold text-slate-900">Permissões</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Visão consolidada do acesso aos módulos do Impulse CRM.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {permissionModules.map((module) => {
                    const explicit = view.permissions?.some((permission) =>
                      permission.toLowerCase().includes(module.toLowerCase()),
                    );
                    const unrestricted = [
                      "GLOBAL_ADMIN",
                      "ADMIN",
                      "ORG_ADMIN",
                    ].includes(view.role);
                    const status =
                      explicit || unrestricted
                        ? "Permissão concedida"
                        : view.permissions?.length
                          ? "Sem acesso"
                          : "Somente leitura";
                    return (
                      <div
                        key={module}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          {module}
                        </span>
                        <Badge
                          variant={
                            status === "Permissão concedida"
                              ? "success"
                              : status === "Somente leitura"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {status === "Permissão concedida" && (
                            <Check size={12} className="mr-1" />
                          )}
                          {status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
      <StatusModal
        user={status}
        saving={saving}
        onClose={() => setStatus(null)}
        onConfirm={handleStatus}
      />
      <PasswordModal
        user={reset}
        password={password}
        saving={saving}
        onPassword={setPassword}
        onClose={() => setReset(null)}
        onConfirm={handleResetPassword}
      />
      <Modal
        isOpen={!!archive}
        title="Arquivar usuário"
        onClose={() => setArchive(null)}
      >
        <p className="text-slate-600">
          O acesso será removido e o usuário sairá das listagens, mas todos os
          dados históricos serão preservados.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setArchive(null)}>
            Cancelar
          </Button>
          <Button variant="danger" loading={saving} onClick={handleArchive}>
            Arquivar usuário
          </Button>
        </div>
      </Modal>
      <Modal
        isOpen={!!remove}
        title="Excluir usuário permanentemente"
        onClose={() => setRemove(null)}
      >
        <p className="text-slate-600">
          Esta ação exclui <strong>{remove?.name}</strong> e não pode ser
          desfeita. Prefira arquivar quando precisar preservar o histórico.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setRemove(null)}>
            Cancelar
          </Button>
          <Button variant="danger" loading={saving} onClick={handleDelete}>
            Excluir permanentemente
          </Button>
        </div>
      </Modal>
    </main>
  );
}

function StatusModal({
  user,
  saving,
  onClose,
  onConfirm,
}: {
  user: User | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      isOpen={!!user}
      title={user?.active ? "Desativar usuário" : "Ativar usuário"}
      onClose={onClose}
    >
      <p className="text-slate-600">
        {user?.active
          ? "O usuário perderá o acesso, mas seus dados históricos serão preservados."
          : "O usuário poderá voltar a acessar o sistema."}
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant={user?.active ? "danger" : "success"}
          loading={saving}
          onClick={onConfirm}
        >
          Confirmar
        </Button>
      </div>
    </Modal>
  );
}
function PasswordModal({
  user,
  password,
  saving,
  onPassword,
  onClose,
  onConfirm,
}: {
  user: User | null;
  password: string;
  saving: boolean;
  onPassword: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);
  const strength = getPasswordStrength(password);
  function generate() {
    onPassword(generateTemporaryPassword());
  }
  async function copy() {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  return (
    <Modal isOpen={!!user} title="Resetar senha" onClose={onClose}>
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <KeyRound />
      </div>
      <p className="mb-5 text-sm leading-6 text-slate-600">
        Crie uma senha temporária forte para <strong>{user?.name}</strong>. A
        senha atual nunca é exibida.
      </p>
      <div className="relative">
        <Input
          label="Nova senha temporária"
          type={visible ? "text" : "password"}
          minLength={8}
          value={password}
          onChange={(e) => onPassword(e.target.value)}
          placeholder="Gere ou digite uma senha"
        />
        <button
          type="button"
          className="absolute right-3 top-10 rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <div
        className="mt-3 flex gap-1"
        aria-label={`Força da senha: ${strength.label}`}
      >
        {[1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className={`h-1.5 flex-1 rounded-full ${level <= strength.level ? strength.color : "bg-slate-200"}`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Força: <strong>{strength.label}</strong>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={generate}>
          <KeyRound size={15} />
          Gerar senha
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void copy()}
          disabled={!password}
        >
          <Clipboard size={15} />
          {copied ? "Copiada" : "Copiar"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled
          title="Integração de e-mail em breve"
        >
          <Mail size={15} />
          Enviar por e-mail (em breve)
        </Button>
      </div>
      <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button loading={saving} onClick={onConfirm}>
          Redefinir com segurança
        </Button>
      </div>
    </Modal>
  );
}
