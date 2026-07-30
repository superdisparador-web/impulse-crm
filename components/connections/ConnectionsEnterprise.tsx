"use client";

import { useMemo, useState } from "react";
import { Archive, CheckCircle2, MessageCircleMore, RefreshCw, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import type { WhatsappAccount, WhatsappAccountStatus } from "@/types/whatsapp";

const statusLabel: Record<WhatsappAccountStatus, string> = { ACTIVE: "Conectada", INACTIVE: "Inativa", PENDING: "Em configuração", ERROR: "Com erro", DISCONNECTED: "Desconectada", SUSPENDED: "Suspensa" };
const date = (value?: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "Nunca";
const quality = (value?: string | null) => ({ GREEN: "Alta", YELLOW: "Média", RED: "Baixa" }[value?.toUpperCase() ?? ""] ?? "Não informada");

type Props = {
  accounts: WhatsappAccount[]; total: number; loading: boolean; error: string; notice: string; busyId: string | null;
  canManage: boolean; isGlobalAdmin: boolean; connecting: boolean;
  onDismissNotice: () => void; onRefresh: () => void; onConnect: () => void; onEdit: (a: WhatsappAccount) => void;
  onArchive: (a: WhatsappAccount) => void; onRestore: (a: WhatsappAccount) => void; onTest: (a: WhatsappAccount) => void;
  onSync: (a: WhatsappAccount) => void; onToggle: (a: WhatsappAccount) => void; onDefault: (a: WhatsappAccount) => void;
};

export function ConnectionsEnterprise(p: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [view, setView] = useState("active");
  const rows = useMemo(() => p.accounts.filter(account => {
    const archived = Boolean(account.deletedAt);
    return (view === "all" || (view === "archived" ? archived : !archived)) && (!status || account.status === status) && (!query.trim() || [account.name, account.phoneNumber, account.displayPhoneNumber, account.wabaId, account.phoneNumberId].some(value => value?.toLowerCase().includes(query.trim().toLowerCase())));
  }), [p.accounts, query, status, view]);
  const active = p.accounts.filter(a => !a.deletedAt);
  const count = (value: WhatsappAccountStatus) => active.filter(a => a.status === value).length;
  const metrics = [
    ["Total de contas", p.total], ["Conectadas", count("ACTIVE")], ["Desconectadas", count("DISCONNECTED") + count("INACTIVE")],
    ["Com erro", count("ERROR") + count("SUSPENDED")], ["Em configuração", count("PENDING")], ["Qualidade baixa", active.filter(a => a.qualityRating?.toUpperCase() === "RED").length],
  ] as const;

  return <main className="space-y-6" aria-labelledby="whatsapp-title">
    <PageHeader title="WhatsApp Oficial" description="Acompanhe os números conectados e mantenha suas conversas prontas para atender clientes." action={<div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={p.onRefresh} disabled={p.loading}><RefreshCw size={16} className={p.loading ? "animate-spin" : ""}/>Atualizar</Button>{p.canManage && <Button onClick={p.onConnect} disabled={p.connecting}>{p.connecting ? "Abrindo autorização…" : p.total ? "Conectar outro número" : "Conectar WhatsApp Oficial"}</Button>}</div>} />
    {p.notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={18}/><span className="flex-1">{p.notice}</span><button onClick={p.onDismissNotice} aria-label="Fechar"><X size={16}/></button></div>}
    {p.error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{p.error}</div>}
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" aria-label="Indicadores reais">{metrics.map(([label, value]) => <StatCard key={label} title={label} value={p.loading ? "—" : value} icon={<MessageCircleMore size={18}/>}/>)}</section>
    <Card className="p-0">
      <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_220px_220px]">
        <Input aria-label="Pesquisar números conectados" placeholder="Pesquise pelo nome ou telefone" value={query} onChange={e => setQuery(e.target.value)}/>
        <Select aria-label="Filtrar por situação" value={status} onChange={e => setStatus(e.target.value)} options={[{ value: "", label: "Todas as situações" }, ...Object.entries(statusLabel).map(([value, label]) => ({ value, label }))]}/>
        <Select aria-label="Filtrar por visão" value={view} onChange={e => setView(e.target.value)} options={[{ value: "active", label: "Ativas" }, { value: "archived", label: "Arquivadas" }, { value: "all", label: "Todas" }]}/>
      </div>
      {loadingOrEmpty(p.loading, rows, p.canManage, p.onConnect) ?? <TableContainer><Table><TableHeader><TableRow><TableHead>Conta conectada</TableHead><TableHead>Telefone</TableHead><TableHead>Data da conexão</TableHead><TableHead>Situação</TableHead><TableHead>Qualidade</TableHead><TableHead>Última sincronização</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader><TableBody>{rows.map(account => <TableRow key={account.id}><TableCell><strong>{account.name}</strong>{account.isDefault && <p className="text-xs text-blue-600">Canal principal</p>}</TableCell><TableCell>{account.displayPhoneNumber || account.phoneNumber || "Não informado"}</TableCell><TableCell>{date(account.connectedAt)}</TableCell><TableCell><Badge>{statusLabel[account.status]}</Badge></TableCell><TableCell>{quality(account.qualityRating)}</TableCell><TableCell>{date(account.lastSyncAt || account.lastConnectionTestAt || account.updatedAt)}</TableCell><TableCell><div className="flex min-w-max flex-wrap gap-1">{account.deletedAt ? <Button size="sm" variant="secondary" onClick={() => p.onRestore(account)}>Restaurar</Button> : <><Button size="sm" variant="secondary" disabled={p.busyId === account.id} onClick={() => p.onTest(account)}>Verificar conexão</Button><Button size="sm" variant="secondary" disabled={p.busyId === account.id} onClick={() => p.onSync(account)}>Atualizar dados</Button><Button size="sm" variant="secondary" onClick={() => p.onToggle(account)}>{account.status === "ACTIVE" ? "Pausar" : "Reativar"}</Button>{!account.isDefault && <Button size="sm" variant="secondary" onClick={() => p.onDefault(account)}>Usar como principal</Button>}<Button size="sm" variant="danger" onClick={() => p.onArchive(account)}><Archive size={14}/>Arquivar</Button></>}</div></TableCell></TableRow>)}</TableBody></Table></TableContainer>}
    </Card>
  </main>;
}

function loadingOrEmpty(loading: boolean, rows: WhatsappAccount[], canManage: boolean, connect: () => void) { if (loading) return <div className="p-10 text-center text-sm text-slate-500">Carregando contas oficiais…</div>; if (rows.length) return null; return <div className="p-6"><EmptyState title="Nenhuma conta encontrada" description="Conecte uma conta oficial da Meta ou ajuste os filtros." action={canManage ? <Button onClick={connect}>Conectar WhatsApp Oficial</Button> : undefined}/></div>; }
