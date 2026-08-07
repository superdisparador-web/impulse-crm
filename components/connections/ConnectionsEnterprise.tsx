"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Archive,
  CheckCircle2,
  MessageCircleMore,
  RefreshCw,
  Settings2,
  ShieldCheck,
  X,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import Modal from "@/components/ui/Modal";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import type { WhatsappAccount, WhatsappAccountStatus } from "@/types/whatsapp";

const statusLabel: Record<WhatsappAccountStatus, string> = {
  ACTIVE: "Conectada",
  INACTIVE: "Inativa",
  PENDING: "Em configuração",
  ERROR: "Com erro",
  DISCONNECTED: "Desconectada",
  SUSPENDED: "Suspensa",
};
const date = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "Nunca";
const quality = (value?: string | null) =>
  ({ GREEN: "Alta", YELLOW: "Média", RED: "Baixa" })[
    value?.toUpperCase() ?? ""
  ] ?? "Não informada";
const mask = (value?: string | null) =>
  !value
    ? "—"
    : value.length < 7
      ? "••••"
      : `${value.slice(0, 3)}••••${value.slice(-3)}`;

type Props = {
  accounts: WhatsappAccount[];
  total: number;
  loading: boolean;
  error: string;
  notice: string;
  busyId: string | null;
  canManage: boolean;
  isGlobalAdmin: boolean;
  connecting: boolean;
  onDismissNotice: () => void;
  onRefresh: () => void;
  onConnect: () => void;
  onManualConnect: () => void;
  onEdit: (a: WhatsappAccount) => void;
  onArchive: (a: WhatsappAccount) => void;
  onRestore: (a: WhatsappAccount) => void;
  onTest: (a: WhatsappAccount) => void;
  onSync: (a: WhatsappAccount) => void;
  onToggle: (a: WhatsappAccount) => void;
  onDefault: (a: WhatsappAccount) => void;
  onUpdateCredential: (a: WhatsappAccount) => void;
};

export function ConnectionsEnterprise(p: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [view, setView] = useState("active");
  const [advanced, setAdvanced] = useState<WhatsappAccount | null>(null);
  const rows = useMemo(
    () =>
      p.accounts.filter((account) => {
        const archived = Boolean(account.deletedAt);
        return (
          (view === "all" || (view === "archived" ? archived : !archived)) &&
          (!status || account.status === status) &&
          (!query.trim() ||
            [
              account.name,
              account.phoneNumber,
              account.displayPhoneNumber,
              account.wabaId,
              account.phoneNumberId,
            ].some((value) =>
              value?.toLowerCase().includes(query.trim().toLowerCase()),
            ))
        );
      }),
    [p.accounts, query, status, view],
  );
  const active = p.accounts.filter((a) => !a.deletedAt);
  const count = (value: WhatsappAccountStatus) =>
    active.filter((a) => a.status === value).length;
  const metrics = [
    ["Total de contas", p.total],
    ["Conectadas", count("ACTIVE")],
    ["Desconectadas", count("DISCONNECTED") + count("INACTIVE")],
    ["Com erro", count("ERROR") + count("SUSPENDED")],
    ["Em configuração", count("PENDING")],
    [
      "Qualidade baixa",
      active.filter((a) => a.qualityRating?.toUpperCase() === "RED").length,
    ],
  ] as const;

  return (
    <main className="space-y-6" aria-labelledby="whatsapp-title">
      <PageHeader
        title="WhatsApp"
        description="Gerencie contas oficiais, números, conexões e configurações da Meta."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={p.onRefresh}
              disabled={p.loading}
            >
              <RefreshCw
                size={16}
                className={p.loading ? "animate-spin" : ""}
              />
              Atualizar
            </Button>
            {p.isGlobalAdmin && (
              <Button variant="secondary" onClick={p.onManualConnect}>
                Cadastro manual
              </Button>
            )}
            {p.canManage && (
              <Button onClick={p.onConnect} disabled={p.connecting}>
                {p.connecting
                  ? "Conectando com a Meta…"
                  : p.total
                    ? "Adicionar outra conta"
                    : "Conectar WhatsApp Oficial"}
              </Button>
            )}
          </div>
        }
      />
      {p.notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <CheckCircle2 size={18} />
          <span className="flex-1">{p.notice}</span>
          <button onClick={p.onDismissNotice} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>
      )}
      {p.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {p.error}
        </div>
      )}
      <section
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        aria-label="Indicadores reais"
      >
        {metrics.map(([label, value]) => (
          <StatCard
            key={label}
            title={label}
            value={p.loading ? "—" : value}
            icon={<MessageCircleMore size={18} />}
          />
        ))}
      </section>
      <Card className="p-0">
        <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_220px_220px]">
          <Input
            aria-label="Buscar contas"
            placeholder="Nome, número, WABA ID ou Phone Number ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select
            aria-label="Filtrar por status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: "", label: "Todos os status" },
              ...Object.entries(statusLabel).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
          <Select
            aria-label="Filtrar por visão"
            value={view}
            onChange={(e) => setView(e.target.value)}
            options={[
              { value: "active", label: "Ativas" },
              { value: "archived", label: "Arquivadas" },
              { value: "all", label: "Todas" },
            ]}
          />
        </div>
        {loadingOrEmpty(
          p.loading,
          rows,
          p.accounts.length,
          p.canManage,
          p.onConnect,
        ) ?? (
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Identificadores Meta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Qualidade</TableHead>
                  <TableHead>Última atividade</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <strong>{account.name}</strong>
                      {account.isDefault && (
                        <p className="text-xs text-blue-600">Padrão</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {account.displayPhoneNumber ||
                        account.phoneNumber ||
                        "Não informado"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      WABA {mask(account.wabaId)}
                      <br />
                      Phone {mask(account.phoneNumberId)}
                    </TableCell>
                    <TableCell>
                      <Badge>{statusLabel[account.status]}</Badge>
                    </TableCell>
                    <TableCell>{quality(account.qualityRating)}</TableCell>
                    <TableCell>
                      {date(
                        account.lastSyncAt ||
                          account.lastConnectionTestAt ||
                          account.updatedAt,
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-max flex-wrap gap-1">
                        {account.deletedAt ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => p.onRestore(account)}
                          >
                            Restaurar
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={p.busyId === account.id}
                              onClick={() => p.onTest(account)}
                            >
                              Testar
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={p.busyId === account.id}
                              onClick={() => p.onSync(account)}
                            >
                              Sincronizar
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => p.onToggle(account)}
                            >
                              {account.status === "ACTIVE"
                                ? "Desativar"
                                : "Ativar"}
                            </Button>
                            {!account.isDefault && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => p.onDefault(account)}
                              >
                                Tornar padrão
                              </Button>
                            )}
                            {p.isGlobalAdmin && (
                              <>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => p.onUpdateCredential(account)}
                                >
                                  Atualizar credencial
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setAdvanced(account)}
                                >
                                  <Settings2 size={14} />
                                  Avançado
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => p.onEdit(account)}
                                >
                                  Editar
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => p.onArchive(account)}
                            >
                              <Archive size={14} />
                              Arquivar
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
      <Modal
        isOpen={Boolean(advanced)}
        title="Configurações avançadas"
        onClose={() => setAdvanced(null)}
      >
        {advanced && (
          <dl className="grid gap-4 sm:grid-cols-2">
            <Item k="URL do webhook" v="/webhooks/meta/whatsapp" />
            <Item
              k="Status do webhook"
              v={
                advanced.webhookSubscribedAt
                  ? "WABA assinada"
                  : "Não confirmado"
              }
            />
            <Item k="App ID" v={mask(advanced.appId)} />
            <Item k="Última sincronização" v={date(advanced.lastSyncAt)} />
            <Item k="Último teste" v={date(advanced.lastConnectionTestAt)} />
            <Item
              k="Credencial"
              v={
                advanced.tokenConfigured
                  ? `Armazenada com segurança${advanced.tokenLast4 ? ` · final ${advanced.tokenLast4}` : ""}`
                  : "Não configurada"
              }
            />
            <div className="sm:col-span-2">
              <Button onClick={() => p.onTest(advanced)}>Testar conexão</Button>
              <p className="mt-4 text-xs text-slate-500">
                App Secret, access token e token de verificação nunca são
                exibidos.
              </p>
            </div>
          </dl>
        )}
      </Modal>
    </main>
  );
}

function loadingOrEmpty(
  loading: boolean,
  rows: WhatsappAccount[],
  accountCount: number,
  canManage: boolean,
  connect: () => void,
) {
  if (loading)
    return (
      <div className="p-10 text-center text-sm text-slate-500">
        Carregando contas oficiais…
      </div>
    );
  if (rows.length) return null;
  if (accountCount)
    return (
      <div className="p-10 text-center text-sm text-slate-500">
        Nenhuma conta corresponde aos filtros selecionados.
      </div>
    );
  return (
    <div className="p-4 sm:p-6">
      <section className="mx-auto flex max-w-3xl flex-col items-center rounded-2xl border border-slate-200 bg-gradient-to-b from-blue-50/70 to-white px-5 py-7 text-center shadow-sm sm:px-10 sm:py-8">
        <Image
          src="/branding/empty-state.png"
          alt=""
          width={320}
          height={200}
          className="h-40 w-auto object-contain sm:h-48"
          priority
        />
        <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Nenhuma conta do WhatsApp conectada
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Conecte sua conta oficial da Meta para enviar mensagens, acompanhar a
          qualidade dos números e gerenciar suas campanhas.
        </p>
        {canManage && (
          <Button onClick={connect} className="mt-5 w-full sm:w-auto">
            Conectar WhatsApp Oficial
          </Button>
        )}
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500 sm:text-sm">
          <ShieldCheck size={17} className="shrink-0 text-emerald-600" />A
          conexão é realizada com segurança pelo ambiente oficial da Meta.
        </p>
      </section>
    </div>
  );
}
function Item({ k, v }: { k: string; v?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-slate-400">{k}</dt>
      <dd className="mt-1 text-sm font-semibold">{v || "Não informado"}</dd>
    </div>
  );
}
