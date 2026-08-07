"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDownUp,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleOff,
  Clock3,
  Columns3,
  Download,
  FilterX,
  KeyRound,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Search,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  Wifi,
  WifiOff,
  X,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import Button from "@/components/ui/Button";
import {
  AutoRefreshStatus,
  BrokerMetricCard,
  TeamSummary,
} from "@/components/users/brokers/BrokerVisuals";
import { User } from "@/types/user";

type SortKey =
  | "name"
  | "email"
  | "phone"
  | "organization"
  | "role"
  | "active"
  | "createdAt"
  | "updatedAt";
type ColumnKey =
  | "broker"
  | "online"
  | "role"
  | "manager"
  | "organization"
  | "phone"
  | "email"
  | "leadsToday"
  | "leadsMonth"
  | "conversion"
  | "averageTime"
  | "lastActivity"
  | "lastLogin"
  | "active"
  | "actions";

interface Props {
  users: User[];
  loading: boolean;
  error: string;
  canManage: boolean;
  onRetry: () => void;
  onCreate: () => void;
  onEdit: (user: User) => void;
  onStatus: (user: User) => void;
  onResetPassword: (user: User) => void;
}

const PAGE_SIZE = 10;
const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "broker", label: "Corretor" },
  { key: "online", label: "Status online" },
  { key: "role", label: "Cargo" },
  { key: "manager", label: "Gerente" },
  { key: "organization", label: "Organização" },
  { key: "phone", label: "WhatsApp / telefone" },
  { key: "email", label: "E-mail" },
  { key: "leadsToday", label: "Leads hoje" },
  { key: "leadsMonth", label: "Leads no mês" },
  { key: "conversion", label: "Conversão" },
  { key: "averageTime", label: "Tempo médio" },
  { key: "lastActivity", label: "Última atividade" },
  { key: "lastLogin", label: "Último login" },
  { key: "active", label: "Situação" },
  { key: "actions", label: "Ações rápidas" },
];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
const date = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
const isOnline = (user: User) =>
  Date.now() - new Date(user.updatedAt).getTime() < 15 * 60 * 1000;

export default function BrokersEnterprise({
  users,
  loading,
  error,
  canManage,
  onRetry,
  onCreate,
  onEdit,
  onStatus,
  onResetPassword,
}: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("");
  const [createdAfter, setCreatedAfter] = useState("");
  const [activityAfter, setActivityAfter] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawer, setDrawer] = useState<User | null>(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visible, setVisible] = useState<Set<ColumnKey>>(
    new Set(ALL_COLUMNS.map(({ key }) => key)),
  );
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  const organizations = useMemo(
    () =>
      [
        ...new Set(
          users.map((u) => u.organization?.name).filter(Boolean) as string[],
        ),
      ].sort(),
    [users],
  );
  const roles = useMemo(
    () => [...new Set(users.map((u) => u.role))].sort(),
    [users],
  );
  const filtered = useMemo(
    () =>
      users
        .filter((user) => {
          const needle = query.toLocaleLowerCase("pt-BR");
          return (
            (!needle ||
              `${user.name} ${user.email} ${user.phone ?? ""}`
                .toLocaleLowerCase("pt-BR")
                .includes(needle)) &&
            (!status || String(user.active) === status) &&
            (!organization || user.organization?.name === organization) &&
            (!role || user.role === role) &&
            (!createdAfter ||
              new Date(user.createdAt) >= new Date(createdAfter)) &&
            (!activityAfter ||
              new Date(user.updatedAt) >= new Date(activityAfter))
          );
        })
        .sort((a, b) => {
          const get = (u: User) =>
            sort === "organization"
              ? (u.organization?.name ?? "")
              : String(u[sort] ?? "");
          return (
            get(a).localeCompare(get(b), "pt-BR", { numeric: true }) *
            (direction === "asc" ? 1 : -1)
          );
        }),
    [
      users,
      query,
      status,
      organization,
      role,
      createdAfter,
      activityAfter,
      sort,
      direction,
    ],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = useMemo(
    () =>
      filtered.slice(
        (Math.min(page, pages) - 1) * PAGE_SIZE,
        Math.min(page, pages) * PAGE_SIZE,
      ),
    [filtered, page, pages],
  );
  const online = useMemo(() => users.filter(isOnline).length, [users]);
  const teamStats = useMemo(() => {
    const now = new Date();
    return {
      active: users.filter((u) => u.active).length,
      inactive: users.filter((u) => !u.active).length,
      newThisMonth: users.filter((u) => {
        const created = new Date(u.createdAt);
        return (
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      }).length,
    };
  }, [users]);
  const activeFilterCount = [
    query,
    status,
    organization,
    role,
    createdAfter,
    activityAfter,
  ].filter(Boolean).length;
  useEffect(() => {
    if (loading || error) return;
    const timer = window.setTimeout(() => setLastUpdated(new Date()), 0);
    return () => window.clearTimeout(timer);
  }, [loading, error, users]);
  const clearFilters = useCallback(() => {
    setQuery("");
    setStatus("");
    setOrganization("");
    setRole("");
    setCreatedAfter("");
    setActivityAfter("");
    setPage(1);
  }, []);
  const toggleSort = useCallback((key: SortKey) => {
    setSort((current) => {
      if (current === key) setDirection((d) => (d === "asc" ? "desc" : "asc"));
      else setDirection("asc");
      return key;
    });
  }, []);
  const exportCsv = useCallback(() => {
    const csv = [
      ["Nome", "Email", "Telefone", "Organização", "Cargo", "Situação"],
      ...filtered.map((u) => [
        u.name,
        u.email,
        u.phone ?? "",
        u.organization?.name ?? "Global",
        u.role,
        u.active ? "Ativo" : "Inativo",
      ]),
    ]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([`\ufeff${csv}`], { type: "text/csv" }),
    );
    link.download = "corretores.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }, [filtered]);
  const show = (key: ColumnKey) => visible.has(key);
  const metrics = [
    [
      "Total de corretores",
      users.length,
      Users,
      "Total retornado pela consulta atual.",
    ],
    [
      "Corretores online",
      online,
      Wifi,
      "Presença estimada por atividade nos últimos 15 minutos.",
    ],
    [
      "Corretores offline",
      users.length - online,
      WifiOff,
      "Sem atividade registrada nos últimos 15 minutos.",
    ],
    [
      "Corretores ativos",
      users.filter((u) => u.active).length,
      UserCheck,
      "Corretores com acesso ativo.",
    ],
    [
      "Corretores inativos",
      users.filter((u) => !u.active).length,
      CircleOff,
      "Corretores com acesso inativo.",
    ],
    [
      "Novos no mês",
      users.filter((u) => {
        const d = new Date(u.createdAt),
          n = new Date();
        return (
          d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
        );
      }).length,
      CheckCircle2,
      "Cadastros realizados no mês corrente.",
    ],
    [
      "Leads recebidos hoje",
      "—",
      BriefcaseBusiness,
      "Métrica indisponível no contrato atual.",
    ],
    [
      "Leads em atendimento",
      "—",
      Activity,
      "Métrica indisponível no contrato atual.",
    ],
    [
      "Conversão média",
      "—",
      TrendingUp,
      "Métrica indisponível no contrato atual.",
    ],
    ["Tempo médio", "—", Clock3, "Métrica indisponível no contrato atual."],
    ["SLA médio", "—", ShieldCheck, "Métrica indisponível no contrato atual."],
    [
      "Ranking geral",
      "—",
      TrendingUp,
      "Métrica indisponível no contrato atual.",
    ],
  ] as const;

  return (
    <main className="space-y-6" aria-labelledby="brokers-title">
      <header className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-blue-50/60 p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-blue-600">
                <Sparkles size={14} />
                Gestão comercial
              </p>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                {users.length} no total
              </span>
            </div>
            <h1
              id="brokers-title"
              className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl"
            >
              Corretores
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Visão executiva da disponibilidade, estrutura e performance da
              equipe comercial.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <AutoRefreshStatus loading={loading} updatedAt={lastUpdated} />
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <button
                onClick={onRetry}
                disabled={loading}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700 disabled:opacity-60 sm:flex-none"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Atualizar
              </button>
              {canManage && <Button onClick={onCreate}>+ Novo corretor</Button>}
            </div>
          </div>
        </div>
      </header>
      <section
        aria-label="Indicadores executivos"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6"
      >
        {metrics.map(([label, value, icon, hint]) => (
          <BrokerMetricCard
            key={label}
            label={label}
            value={value}
            icon={icon}
            hint={hint}
            loading={loading}
          />
        ))}
      </section>
      <TeamSummary
        total={users.length}
        active={teamStats.active}
        inactive={teamStats.inactive}
        online={online}
        offline={users.length - online}
        newThisMonth={teamStats.newThisMonth}
      />
      <section
        className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
        aria-label="Filtros de corretores"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-slate-900">
              <SlidersHorizontal size={17} className="text-blue-600" />
              Filtros avançados{" "}
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                  {activeFilterCount}
                </span>
              )}
            </h2>
            <p aria-live="polite" className="mt-1 text-xs text-slate-500">
              {filtered.length} de {users.length} corretores correspondem aos
              critérios.
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={clearFilters}
              disabled={!activeFilterCount}
              className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              <FilterX size={16} />
              Limpar
            </button>
            <button
              onClick={() => setFiltersExpanded((value) => !value)}
              aria-expanded={filtersExpanded}
              aria-controls="broker-advanced-filters"
              className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold hover:bg-slate-50"
            >
              {filtersExpanded ? "Recolher" : "Expandir"}
            </button>
          </div>
        </div>
        {filtersExpanded && (
          <div
            id="broker-advanced-filters"
            className="mt-5 grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-2 xl:grid-cols-6"
          >
            <label className="relative xl:col-span-2">
              <span className="sr-only">Nome, e-mail ou telefone</span>
              <Search
                className="absolute left-3 top-3 text-slate-400"
                size={17}
              />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Nome, e-mail ou telefone"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 outline-none focus:border-blue-500"
              />
            </label>
            <select
              aria-label="Organização"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="rounded-xl border border-slate-200 px-3"
            >
              <option value="">Organizações</option>
              {organizations.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <select
              aria-label="Cargo"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-xl border border-slate-200 px-3"
            >
              <option value="">Cargos</option>
              {roles.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <select
              aria-label="Situação"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-slate-200 px-3"
            >
              <option value="">Status: todos</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
            <select
              aria-label="Disponibilidade"
              className="rounded-xl border border-slate-200 px-3"
              disabled
              title="O contrato atual não oferece filtro de presença"
            >
              <option>Online / offline</option>
            </select>
            <label className="text-xs font-semibold text-slate-500">
              Cadastro desde
              <input
                type="date"
                value={createdAfter}
                onChange={(e) => setCreatedAfter(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2"
              />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Atividade desde
              <input
                type="date"
                value={activityAfter}
                onChange={(e) => setActivityAfter(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2"
              />
            </label>
            <input
              aria-label="Gerente"
              disabled
              placeholder="Gerente — indisponível"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3"
            />
            <input
              aria-label="Região"
              disabled
              placeholder="Região — indisponível"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3"
            />
            <input
              aria-label="Equipe"
              disabled
              placeholder="Equipe — indisponível"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3"
            />
            <input
              aria-label="Conversão mínima"
              disabled
              placeholder="Conversão — indisponível"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3"
            />
          </div>
        )}
      </section>
      <section
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        aria-label="Tabela de corretores"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <h2 className="font-bold text-slate-900">Equipe comercial</h2>
            <p aria-live="polite" className="text-xs text-slate-500">
              {rows.length} de {filtered.length} corretores exibidos ·{" "}
              {selected.size} selecionados
            </p>
          </div>
          <div className="relative flex gap-2">
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              <Download size={16} />
              Exportar
            </button>
            <button
              onClick={() => setColumnsOpen(!columnsOpen)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
              aria-expanded={columnsOpen}
            >
              <Columns3 size={16} />
              Colunas
            </button>
            {columnsOpen && (
              <div className="absolute right-0 top-11 z-20 max-h-80 w-64 overflow-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                {ALL_COLUMNS.map((column) => (
                  <label key={column.key} className="flex gap-2 p-2 text-sm">
                    <input
                      type="checkbox"
                      checked={visible.has(column.key)}
                      onChange={() =>
                        setVisible((old) => {
                          const next = new Set(old);
                          if (next.has(column.key)) next.delete(column.key);
                          else next.add(column.key);
                          return next;
                        })
                      }
                    />
                    {column.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-blue-100 bg-blue-50 px-4 py-3">
            <strong className="mr-2 text-sm text-blue-900">
              Ações em lote
            </strong>
            {["Ativar", "Desativar", "Trocar gerente"].map((label) => (
              <button
                key={label}
                disabled
                title="Requer operação em lote no contrato da API"
                className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-slate-400"
              >
                {label}
              </button>
            ))}
            <span className="text-xs text-blue-700">
              Indisponíveis até o backend oferecer execução atômica.
            </span>
          </div>
        )}
        {error ? (
          <div className="p-12 text-center" role="alert">
            <WifiOff className="mx-auto mb-3 text-red-500" />
            <h3 className="font-bold">
              Não foi possível carregar os corretores
            </h3>
            <p className="mb-4 text-sm text-slate-500">{error}</p>
            <Button onClick={onRetry}>Tentar novamente</Button>
          </div>
        ) : loading ? (
          <div className="space-y-3 p-5" aria-label="Carregando tabela">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-14 text-center">
            <Users className="mx-auto mb-3 text-slate-300" size={36} />
            <h3 className="font-bold">Nenhum corretor encontrado</h3>
            <p className="text-sm text-slate-500">
              Ajuste os filtros ou limpe a busca para ver a equipe.
            </p>
          </div>
        ) : (
          <div className="overflow-auto brokers-scroll">
            <table className="min-w-[1650px] w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="p-4">
                    <input
                      aria-label="Selecionar todos da página"
                      type="checkbox"
                      checked={rows.every((u) => selected.has(u.id))}
                      onChange={() =>
                        setSelected((old) =>
                          rows.every((u) => old.has(u.id))
                            ? new Set()
                            : new Set(rows.map((u) => u.id)),
                        )
                      }
                    />
                  </th>
                  {show("broker") && (
                    <Sortable
                      label="Avatar · Nome · Foto"
                      active={sort === "name"}
                      onClick={() => toggleSort("name")}
                    />
                  )}{" "}
                  {show("online") && <th className="p-4">Online</th>}
                  {show("role") && (
                    <Sortable
                      label="Cargo"
                      active={sort === "role"}
                      onClick={() => toggleSort("role")}
                    />
                  )}{" "}
                  {show("manager") && <th className="p-4">Gerente</th>}
                  {show("organization") && (
                    <Sortable
                      label="Organização"
                      active={sort === "organization"}
                      onClick={() => toggleSort("organization")}
                    />
                  )}{" "}
                  {show("phone") && (
                    <Sortable
                      label="WhatsApp · Telefone"
                      active={sort === "phone"}
                      onClick={() => toggleSort("phone")}
                    />
                  )}{" "}
                  {show("email") && (
                    <Sortable
                      label="E-mail"
                      active={sort === "email"}
                      onClick={() => toggleSort("email")}
                    />
                  )}{" "}
                  {show("leadsToday") && <th className="p-4">Leads hoje</th>}
                  {show("leadsMonth") && <th className="p-4">Leads mês</th>}
                  {show("conversion") && <th className="p-4">Conversão</th>}
                  {show("averageTime") && <th className="p-4">Tempo médio</th>}
                  {show("lastActivity") && (
                    <Sortable
                      label="Última atividade"
                      active={sort === "updatedAt"}
                      onClick={() => toggleSort("updatedAt")}
                    />
                  )}{" "}
                  {show("lastLogin") && <th className="p-4">Último login</th>}
                  {show("active") && (
                    <Sortable
                      label="Situação"
                      active={sort === "active"}
                      onClick={() => toggleSort("active")}
                    />
                  )}{" "}
                  {show("actions") && <th className="p-4">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => (
                  <BrokerRow
                    key={user.id}
                    user={user}
                    selected={selected.has(user.id)}
                    show={show}
                    canManage={canManage}
                    onSelect={() =>
                      setSelected((old) => {
                        const next = new Set(old);
                        if (next.has(user.id)) next.delete(user.id);
                        else next.add(user.id);
                        return next;
                      })
                    }
                    onOpen={() => setDrawer(user)}
                    onEdit={() => onEdit(user)}
                    onStatus={() => onStatus(user)}
                    onReset={() => onResetPassword(user)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-200 p-4">
          <span className="text-sm text-slate-500">
            Página {Math.min(page, pages)} de {pages}
          </span>
          <div className="flex gap-2">
            <button
              aria-label="Página anterior"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border p-2 disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              aria-label="Próxima página"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border p-2 disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
      {drawer && (
        <BrokerDrawer
          user={drawer}
          canManage={canManage}
          onClose={() => setDrawer(null)}
          onEdit={() => {
            setDrawer(null);
            onEdit(drawer);
          }}
        />
      )}
    </main>
  );
}

function Sortable({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <th className="p-4">
      <button
        onClick={onClick}
        className="flex items-center gap-1 font-bold"
        aria-label={`Ordenar por ${label}`}
      >
        {label}
        <ArrowDownUp
          size={13}
          className={active ? "text-blue-600" : "text-slate-300"}
        />
      </button>
    </th>
  );
}

const BrokerRow = memo(function BrokerRow({
  user,
  selected,
  show,
  canManage,
  onSelect,
  onOpen,
  onEdit,
  onStatus,
  onReset,
}: {
  user: User;
  selected: boolean;
  show: (key: ColumnKey) => boolean;
  canManage: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onEdit: () => void;
  onStatus: () => void;
  onReset: () => void;
}) {
  const online = isOnline(user);
  return (
    <tr
      aria-selected={selected}
      tabIndex={0}
      className={`broker-row border-t border-slate-100 transition focus-within:bg-blue-50 focus:bg-blue-50 ${selected ? "bg-blue-50/90 shadow-[inset_3px_0_0_#2563eb]" : online ? "bg-emerald-50/20 hover:bg-blue-50/50" : "hover:bg-blue-50/40"}`}
    >
      <td className="p-4">
        <input
          aria-label={`Selecionar ${user.name}`}
          type="checkbox"
          checked={selected}
          onChange={onSelect}
        />
      </td>
      {show("broker") && (
        <td className="p-4">
          <button
            onClick={onOpen}
            className="flex items-center gap-3 text-left"
          >
            <span
              className="relative grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 font-extrabold text-white shadow-sm"
              aria-label={`Avatar de ${user.name}`}
            >
              {initials(user.name)}
              <i
                className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white ${online ? "bg-emerald-500" : "bg-slate-400"}`}
                aria-hidden="true"
              />
            </span>
            <span>
              <strong className="block text-slate-900 hover:text-blue-600">
                {user.name}
              </strong>
              <small className="text-slate-400">ID {user.id.slice(0, 8)}</small>
            </span>
          </button>
        </td>
      )}
      {show("online") && (
        <td className="p-4">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-bold ${online ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
          >
            <i
              className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-slate-400"}`}
            />
            {online ? "Online" : "Offline"}
          </span>
        </td>
      )}
      {show("role") && <td className="p-4">{user.role}</td>}
      {show("manager") && <td className="p-4 text-slate-400">—</td>}
      {show("organization") && (
        <td className="p-4">{user.organization?.name ?? "Global"}</td>
      )}
      {show("phone") && (
        <td className="p-4">
          <a
            href={
              user.phone
                ? `https://wa.me/${user.phone.replace(/\D/g, "")}`
                : undefined
            }
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-slate-600 hover:text-emerald-600"
          >
            <MessageCircle size={15} />
            {user.phone ?? "—"}
          </a>
        </td>
      )}
      {show("email") && (
        <td className="p-4">
          <a href={`mailto:${user.email}`} className="hover:text-blue-600">
            {user.email}
          </a>
        </td>
      )}
      {show("leadsToday") && <td className="p-4 text-slate-400">—</td>}
      {show("leadsMonth") && <td className="p-4 text-slate-400">—</td>}
      {show("conversion") && <td className="p-4 text-slate-400">—</td>}
      {show("averageTime") && <td className="p-4 text-slate-400">—</td>}
      {show("lastActivity") && <td className="p-4">{date(user.updatedAt)}</td>}
      {show("lastLogin") && <td className="p-4 text-slate-400">—</td>}
      {show("active") && (
        <td className="p-4">
          <span
            className={`rounded-full px-2 py-1 text-xs font-bold ${user.active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
          >
            {user.active ? "Ativo" : "Inativo"}
          </span>
        </td>
      )}
      {show("actions") && (
        <td className="p-4">
          <div className="flex gap-1">
            <button
              onClick={onOpen}
              title="Ver perfil"
              aria-label={`Ver perfil de ${user.name}`}
              className="rounded-lg p-2 hover:bg-white"
            >
              <MoreHorizontal size={18} />
            </button>
            {canManage && (
              <>
                <button
                  onClick={onEdit}
                  title="Editar"
                  aria-label={`Editar ${user.name}`}
                  className="rounded-lg p-2 hover:bg-white"
                >
                  <Activity size={17} />
                </button>
                <button
                  onClick={onReset}
                  title="Resetar senha"
                  aria-label={`Resetar senha de ${user.name}`}
                  className="rounded-lg p-2 hover:bg-white"
                >
                  <KeyRound size={17} />
                </button>
                <button
                  onClick={onStatus}
                  title={user.active ? "Desativar" : "Ativar"}
                  aria-label={`${user.active ? "Desativar" : "Ativar"} ${user.name}`}
                  className="rounded-lg p-2 hover:bg-white"
                >
                  <UserCheck size={17} />
                </button>
              </>
            )}
          </div>
        </td>
      )}
    </tr>
  );
});

function BrokerDrawer({
  user,
  canManage,
  onClose,
  onEdit,
}: {
  user: User;
  canManage: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    returnFocusRef.current = document.activeElement as HTMLElement;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      returnFocusRef.current?.focus();
    };
  }, [onClose]);

  const online = isOnline(user);
  const futureActions = [
    "Trocar gerente",
    "Transferir leads",
    "Visualizar leads",
    "Enviar mensagem",
    "Histórico",
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="broker-profile-title"
        aria-describedby="broker-profile-description"
        className="broker-drawer ml-auto flex h-full w-full max-w-xl flex-col bg-slate-50 shadow-2xl"
      >
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 p-5 backdrop-blur sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 gap-4">
              <span
                className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-extrabold text-white shadow-lg shadow-blue-200"
                aria-label={`Avatar de ${user.name}`}
              >
                {initials(user.name)}
                <i
                  className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-white ${online ? "bg-emerald-500" : "bg-slate-400"}`}
                  aria-hidden="true"
                />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Perfil do corretor
                </p>
                <h2
                  id="broker-profile-title"
                  className="truncate text-2xl font-extrabold text-slate-950"
                  title={user.name}
                >
                  {user.name}
                </h2>
                <p
                  id="broker-profile-description"
                  className="mt-1 flex flex-wrap gap-2 text-xs"
                >
                  <span
                    className={`rounded-full px-2 py-1 font-bold ${user.active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                  >
                    {user.active ? "Ativo" : "Inativo"}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 font-bold ${online ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    {online ? "Online estimado" : "Offline estimado"}
                  </span>
                </p>
              </div>
            </div>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Fechar perfil"
              className="grid min-h-11 min-w-11 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X />
            </button>
          </div>
        </header>
        <div className="flex-1 space-y-7 overflow-y-auto p-5 sm:p-6">
          <section aria-labelledby="overview-title">
            <div className="mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Visão geral
              </p>
              <h3
                id="overview-title"
                className="text-lg font-bold text-slate-950"
              >
                Identidade e contatos
              </h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Info icon={Mail} label="E-mail" value={user.email} />
              <Info
                icon={MessageCircle}
                label="WhatsApp / telefone"
                value={user.phone ?? "Não informado"}
              />
              <Info
                icon={BriefcaseBusiness}
                label="Organização"
                value={user.organization?.name ?? "Global"}
              />
              <Info
                icon={Clock3}
                label="Data de cadastro"
                value={date(user.createdAt)}
              />
              <Info
                icon={Activity}
                label="Última atividade"
                value={date(user.updatedAt)}
              />
              <Info
                icon={Users}
                label="Equipe e gerente"
                value="Dados ainda não integrados"
              />
            </div>
          </section>
          <section aria-labelledby="performance-title">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Performance
            </p>
            <h3
              id="performance-title"
              className="text-lg font-bold text-slate-950"
            >
              Indicadores comerciais
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                "Total de leads",
                "Novos",
                "Em atendimento",
                "Agendados",
                "Visitas",
                "Vendas",
                "Perdidos",
                "Conversão",
                "Tempo médio",
                "SLA",
              ].map((label) => (
                <div
                  key={label}
                  title="Disponível após integração com Leads"
                  className="rounded-xl border border-dashed border-slate-200 bg-white p-3"
                >
                  <span className="text-xs font-semibold text-slate-600">
                    {label}
                  </span>
                  <span className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <MoreHorizontal size={14} />
                    Aguardando integração
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[
                "Funil",
                "Leads por dia",
                "Conversão mensal",
                "Performance semanal",
              ].map((label) => (
                <div
                  key={label}
                  className="grid min-h-24 place-items-center rounded-xl border border-dashed border-slate-200 bg-white p-3 text-center text-xs text-slate-500"
                >
                  <span>
                    <TrendingUp
                      className="mx-auto mb-1 text-slate-300"
                      size={18}
                    />
                    <strong className="block text-slate-600">{label}</strong>
                    Fonte de dados ainda não integrada
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section aria-labelledby="access-title">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Acesso e permissões
            </p>
            <h3 id="access-title" className="text-lg font-bold text-slate-950">
              Conta do usuário
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Info
                icon={ShieldCheck}
                label="Função e permissões"
                value={user.role}
              />
              <Info
                icon={Wifi}
                label="Último login"
                value="Dado ainda não integrado"
              />
            </div>
          </section>
          <section aria-labelledby="actions-title">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Ações rápidas
            </p>
            <h3 id="actions-title" className="text-lg font-bold text-slate-950">
              Operações disponíveis
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {canManage && <Button onClick={onEdit}>Editar</Button>}
              <a
                href={
                  user.phone
                    ? `https://wa.me/${user.phone.replace(/\D/g, "")}`
                    : "#"
                }
                target="_blank"
                rel="noreferrer"
                aria-disabled={!user.phone}
                className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-4 font-semibold shadow-sm"
              >
                Abrir WhatsApp
              </a>
            </div>
            <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/70 p-4">
              <h4 className="text-sm font-bold text-violet-900">
                Integrações futuras
              </h4>
              <p className="mt-1 text-xs leading-5 text-violet-700">
                Estas ações precisam dos contratos de Leads, Mensagens e Gestão
                de Equipes. Permanecem desabilitadas para preservar segurança e
                atomicidade.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {futureActions.map((label) => (
                  <button
                    key={label}
                    disabled
                    title={`${label}: requer integração específica no backend`}
                    className="rounded-lg border border-violet-200 bg-white/70 px-3 py-2 text-xs font-semibold text-violet-400"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Icon size={14} />
        {label}
      </span>
      <strong className="mt-1 block truncate text-sm">{value}</strong>
    </div>
  );
}
