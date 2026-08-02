"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowDownUp,
  CopyPlus,
  Eye,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Power,
  Trash2,
  UserRoundSearch,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { User, UserRole } from "@/types/user";

const roleLabels: Record<UserRole, string> = {
  GLOBAL_ADMIN: "Administrador global",
  ADMIN: "Administrador",
  ORG_ADMIN: "Administrador",
  MANAGER: "Gerente",
  CORRETOR: "Corretor",
  BROKER: "Corretor",
};

const date = (value?: string | null, withTime = false) =>
  value
    ? new Intl.DateTimeFormat(
        "pt-BR",
        withTime
          ? { dateStyle: "short", timeStyle: "short" }
          : { dateStyle: "short" }
      ).format(new Date(value))
    : "Nunca";

type SortKey =
  | "name"
  | "title"
  | "email"
  | "phone"
  | "organization"
  | "active"
  | "lastLoginAt"
  | "createdAt";

interface Props {
  users: User[];
  loading: boolean;
  error: string;
  canManage: boolean;
  onRetry: () => void;
  onCreate: () => void;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onStatus: (user: User) => void;
  onResetPassword: (user: User) => void;
  onArchive: (user: User) => void;
  onDelete: (user: User) => void;
}

function SortHeading({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 font-semibold transition hover:text-slate-900"
      onClick={onClick}
      aria-label={`Ordenar por ${label}`}
    >
      {label}
      <ArrowDownUp
        size={13}
        className={active ? "text-blue-600" : "text-slate-300"}
      />
    </button>
  );
}

function UserAvatar({ user }: { user: User }) {
  const [source, setSource] = useState(
    user.avatarUrl || "/branding/impulse-helmet.png"
  );

  return (
    <span className="relative block h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-50 shadow-sm">
      <Image
        src={source}
        alt={`Avatar de ${user.name}`}
        fill
        sizes="40px"
        unoptimized={Boolean(user.avatarUrl)}
        className="object-cover"
        onError={() => setSource("/branding/impulse-helmet.png")}
      />
    </span>
  );
}

export default function UserTable(props: Props) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("name");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeMenu(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  const rows = useMemo(() => {
    const value = (user: User) => {
      if (sort === "organization") return user.organization?.name ?? "";
      if (sort === "active") return String(user.active);
      return String(user[sort] ?? "");
    };

    return [...props.users].sort(
      (left, right) =>
        value(left).localeCompare(value(right), "pt-BR", { numeric: true }) *
        (direction === "asc" ? 1 : -1)
    );
  }, [direction, props.users, sort]);

  function sortBy(column: SortKey) {
    if (sort === column) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSort(column);
    setDirection("asc");
  }

  const heading = (label: string, column: SortKey) => (
    <SortHeading
      label={label}
      active={sort === column}
      onClick={() => sortBy(column)}
    />
  );

  return (
    <TableContainer>
      <Table className="min-w-[1420px]">
        <TableHeader>
          <TableRow>
            <TableHead>Avatar</TableHead>
            <TableHead>{heading("Nome", "name")}</TableHead>
            <TableHead>{heading("Cargo", "title")}</TableHead>
            <TableHead>{heading("E-mail", "email")}</TableHead>
            <TableHead>{heading("Telefone", "phone")}</TableHead>
            <TableHead>{heading("Organização", "organization")}</TableHead>
            <TableHead>{heading("Status", "active")}</TableHead>
            <TableHead>{heading("Último acesso", "lastLoginAt")}</TableHead>
            <TableHead>{heading("Criado em", "createdAt")}</TableHead>
            <TableHead align="right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.loading &&
            Array.from({ length: 6 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={10}>
                  <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
                </TableCell>
              </TableRow>
            ))}

          {!props.loading && props.error && (
            <TableRow>
              <TableCell colSpan={10}>
                <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
                  <p className="font-semibold">Não foi possível carregar os usuários</p>
                  <p className="mt-1 text-sm">{props.error}</p>
                  <Button className="mt-4" variant="secondary" onClick={props.onRetry}>
                    Tentar novamente
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}

          {!props.loading && !props.error && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={10}>
                <div className="py-16 text-center">
                  <UserRoundSearch className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 font-semibold text-slate-900">
                    Nenhum usuário encontrado
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Ajuste os filtros ou cadastre um novo usuário.
                  </p>
                  {props.canManage && (
                    <Button className="mt-5" onClick={props.onCreate}>
                      Novo usuário
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}

          {!props.loading &&
            !props.error &&
            rows.map((user) => (
              <TableRow key={user.id}>
                <TableCell><UserAvatar user={user} /></TableCell>
                <TableCell>
                  <button
                    className="font-semibold text-slate-900 transition hover:text-blue-700 hover:underline"
                    onClick={() => props.onView(user)}
                  >
                    {user.name}
                  </button>
                  <p className="mt-0.5 text-xs text-slate-400">ID {user.id.slice(0, 8)}</p>
                </TableCell>
                <TableCell>{user.title || roleLabels[user.role]}</TableCell>
                <TableCell className="text-slate-600">{user.email}</TableCell>
                <TableCell>{user.phone || "—"}</TableCell>
                <TableCell>{user.organization?.name || "Escopo global"}</TableCell>
                <TableCell>
                  <Badge variant={user.active ? "success" : "neutral"}>
                    <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${user.active ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {user.active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>{date(user.lastLoginAt, true)}</TableCell>
                <TableCell>{date(user.createdAt)}</TableCell>
                <TableCell align="right">
                  <div
                    ref={openMenu === user.id ? menuRef : undefined}
                    className="relative inline-block"
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-haspopup="menu"
                      aria-expanded={openMenu === user.id}
                      aria-label={`Ações de ${user.name}`}
                      onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                    >
                      <MoreHorizontal size={18} />
                    </Button>
                    {openMenu === user.id && (
                      <div
                        role="menu"
                        className="absolute right-0 z-30 mt-1 w-56 rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-xl"
                      >
                        {[
                          { Icon: Eye, label: "Visualizar", action: props.onView },
                          { Icon: Pencil, label: "Editar", action: props.onEdit },
                          { Icon: KeyRound, label: "Resetar senha", action: props.onResetPassword },
                          { Icon: Power, label: user.active ? "Desativar" : "Ativar", action: props.onStatus },
                          { Icon: Archive, label: "Arquivar", action: props.onArchive },
                          { Icon: Trash2, label: "Excluir", action: props.onDelete, danger: true },
                        ].map(({ Icon, label, action, danger }) => (
                          <button
                            role="menuitem"
                            key={label}
                            onClick={() => { action(user); setOpenMenu(null); }}
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-slate-50 ${danger ? "text-red-600" : "text-slate-700"}`}
                          >
                            <Icon size={16} />{label}
                          </button>
                        ))}
                        <button
                          role="menuitem"
                          disabled
                          title="Em breve"
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400"
                        >
                          <CopyPlus size={16} />Duplicar usuário (em breve)
                        </button>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
