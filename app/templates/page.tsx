"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Archive,
  FileText,
  FolderOpen,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { templatesService } from "@/services/templates.service";
import { whatsappService } from "@/services/whatsapp.service";
import type { WhatsappTemplate, WhatsappTemplateStatus } from "@/types/templates";
import type { WhatsappAccount } from "@/types/whatsapp";

const labels: Record<WhatsappTemplateStatus, string> = { DRAFT: "Rascunho", PENDING: "Em análise", APPROVED: "Aprovado", REJECTED: "Rejeitado", PAUSED: "Pausado", DISABLED: "Desativado", IN_APPEAL: "Em recurso", PENDING_DELETION: "Exclusão pendente", DELETED: "Excluído", LIMIT_EXCEEDED: "Limite excedido", UNKNOWN: "Não disponível para envio" };
const cats: Record<string, string> = { MARKETING: "Marketing", UTILITY: "Utilidade", AUTHENTICATION: "Autenticação" };
const date = (value?: string | null) => value ? new Date(value).toLocaleString("pt-BR") : "Nunca";
const controlClass = "min-h-12 bg-white";

export default function TemplatesPage() {
  const [items, setItems] = useState<WhatsappTemplate[]>([]);
  const [accounts, setAccounts] = useState<WhatsappAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState<string | null>(null);
  const [q, setQ] = useState({ page: 1, pageSize: 10, whatsappAccountId: "", search: "", status: "", category: "", language: "", state: "" });
  const [meta, setMeta] = useState<{ total: number; totalPages: number; lastSyncedAt: string | null }>({ total: 0, totalPages: 1, lastSyncedAt: null });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await templatesService.getTemplates({ ...q, state: (q.state || undefined) as "active" | "inactive" | "archived" | "all" | undefined });
      setItems(response.items);
      setMeta({ total: response.total, totalPages: response.totalPages, lastSyncedAt: response.lastSyncedAt });
      setError("");
    } catch {
      setError("Não foi possível carregar os modelos de mensagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => { void whatsappService.getAccounts({ pageSize: 100 }).then((response) => setAccounts(response.items)).catch(() => setError("Não foi possível carregar suas contas conectadas. Tente novamente.")); }, []);
  useEffect(() => { const id = setTimeout(() => void load(), 100); return () => clearTimeout(id); }, [load]);

  const set = (key: string, value: string) => setQ((current) => ({ ...current, page: 1, [key]: value }));
  async function sync() { if (!q.whatsappAccountId) return; setSyncing(true); try { const result = await templatesService.syncTemplates(q.whatsappAccountId); setNotice(`${result.totalFound} encontrados — ${result.created} criados, ${result.updated} atualizados, ${result.unchanged} sem alterações, ${result.archived} arquivados e ${result.errors.length} erros.`); await load(); } catch { setError("Não foi possível atualizar os modelos de mensagem. Tente novamente."); } finally { setSyncing(false); } }
  async function archive(template: WhatsappTemplate) { try { await (template.archivedAt || template.deletedAt ? templatesService.restoreTemplate(template.id) : templatesService.archiveTemplate(template.id)); await load(); } catch { setError("Não foi possível concluir esta ação. Tente novamente."); } }

  return <main className="space-y-6 text-slate-900">
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Modelos de mensagem</h1><p className="mt-2 text-sm text-slate-500 sm:text-base">Crie e organize mensagens padronizadas para suas campanhas no WhatsApp Oficial.</p></div>
      <Link href="/templates/new" className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 sm:self-auto"><Plus size={18} />Criar rascunho</Link>
    </header>

    {(error || notice) && <div role="status" className={`rounded-xl border p-4 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error || notice}</div>}

    <Card padding="md" className="space-y-5">
      <div className="grid items-end gap-4 lg:grid-cols-[minmax(280px,1fr)_auto_auto]">
        <Select label="Conta WhatsApp" className={controlClass} value={q.whatsappAccountId} onChange={(event) => set("whatsappAccountId", event.target.value)} options={[{ value: "", label: "Todas as contas" }, ...accounts.map((account) => ({ value: account.id, label: account.name }))]} />
        <Button variant="secondary" size="lg" disabled={!q.whatsappAccountId} loading={syncing} onClick={() => void sync()} className="text-blue-600"><RefreshCw size={18} />{syncing ? "Atualizando..." : "Atualizar modelos"}</Button>
        <div className="min-w-44 pb-1 text-sm text-slate-500"><strong className="block font-semibold text-slate-900">{meta.total} modelos</strong><span className="mt-1 block text-xs">Última atualização: {date(meta.lastSyncedAt)}</span></div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.45fr_repeat(4,minmax(150px,1fr))]">
        <div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400" size={18} /><Input aria-label="Buscar por nome ou conteúdo" className={`${controlClass} pl-11`} placeholder="Buscar por nome ou conteúdo" value={q.search} onChange={(event) => set("search", event.target.value)} /></div>
        <Select aria-label="Status" className={controlClass} value={q.status} onChange={(event) => set("status", event.target.value)} options={[{ value: "", label: "Todos os status" }, ...Object.entries(labels).map(([value, label]) => ({ value, label }))]} />
        <Select aria-label="Categoria" className={controlClass} value={q.category} onChange={(event) => set("category", event.target.value)} options={[{ value: "", label: "Todas as categorias" }, ...Object.entries(cats).map(([value, label]) => ({ value, label }))]} />
        <Select aria-label="Idioma" className={controlClass} value={q.language} onChange={(event) => set("language", event.target.value)} options={[{ value: "", label: "Idioma (pt_BR)" }, { value: "pt_BR", label: "Português (pt_BR)" }, { value: "en_US", label: "Inglês (en_US)" }, { value: "es", label: "Espanhol (es)" }]} />
        <Select aria-label="Estado" className={controlClass} value={q.state} onChange={(event) => set("state", event.target.value)} options={[{ value: "", label: "Apenas ativos" }, { value: "inactive", label: "Inativos" }, { value: "archived", label: "Arquivados" }, { value: "all", label: "Todos" }]} />
      </div>
    </Card>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/70"><tr>{["Nome do modelo", "Idioma", "Categoria", "Situação", "Qualidade", "Conta", "Última atualização", "Ações"].map((heading) => <th key={heading} className="whitespace-nowrap px-5 py-4 font-semibold text-slate-700">{heading}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <LoadingRow /> : items.length === 0 ? <EmptyRow /> : items.map((template) => <Template key={template.id} t={template} open={detail === template.id} toggle={() => setDetail(detail === template.id ? null : template.id)} archive={archive} />)}
          </tbody>
        </table>
      </div>
      <footer className="grid grid-cols-3 items-center border-t border-slate-200 px-5 py-4 text-sm text-slate-600">
        <button disabled={q.page <= 1} className="justify-self-start rounded-lg px-2 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40" onClick={() => setQ((current) => ({ ...current, page: current.page - 1 }))}>Anterior</button>
        <span className="justify-self-center">Página {q.page} de {meta.totalPages || 1}</span>
        <button disabled={q.page >= meta.totalPages} className="justify-self-end rounded-lg px-2 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40" onClick={() => setQ((current) => ({ ...current, page: current.page + 1 }))}>Próxima</button>
      </footer>
    </section>

    <Card padding="none" className="grid divide-y divide-slate-200 md:grid-cols-3 md:divide-x md:divide-y-0">
      <Info icon={<RefreshCw size={22} />} color="blue" title="Sincronização">Mantenha os modelos atualizados para utilizá-los nas campanhas.</Info>
      <Info icon={<ShieldCheck size={22} />} color="emerald" title="Qualidade">A qualidade das mensagens impacta diretamente na entrega e engajamento das mensagens.</Info>
      <Info icon={<FolderOpen size={22} />} color="violet" title="Categorias">Organize seus modelos por categoria para facilitar a gestão e reutilização.</Info>
    </Card>
  </main>;
}

function LoadingRow() { return <tr><td colSpan={8} className="p-6"><div aria-label="Carregando templates" className="h-36 animate-pulse rounded-xl bg-slate-100" /></td></tr>; }
function EmptyRow() { return <tr><td colSpan={8} className="px-5 py-8"><div className="flex min-h-52 flex-col items-center justify-center text-center"><div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500"><FileText size={30} strokeWidth={1.6} /></div><h2 className="font-semibold text-slate-900">Nenhum modelo encontrado.</h2><p className="mt-2 text-sm text-slate-500">Crie um rascunho para preparar sua primeira mensagem.</p><Link href="/templates/new" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-700"><Plus size={17} />Criar rascunho</Link></div></td></tr>; }

function Info({ icon, color, title, children }: { icon: React.ReactNode; color: "blue" | "emerald" | "violet"; title: string; children: React.ReactNode }) {
  const colors = { blue: "bg-blue-50 text-blue-600", emerald: "bg-emerald-50 text-emerald-600", violet: "bg-violet-50 text-violet-600" };
  return <article className="flex gap-4 p-5"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${colors[color]}`}>{icon}</div><div><h2 className="font-semibold text-slate-900">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{children}</p></div></article>;
}

function Template({ t, open, toggle, archive }: { t: WhatsappTemplate; open: boolean; toggle: () => void; archive: (template: WhatsappTemplate) => Promise<void> }) {
  return <><tr className="transition hover:bg-slate-50/70"><td className="px-5 py-4"><button className="font-semibold text-slate-900 hover:text-blue-600" onClick={toggle}>{t.name}</button></td><td className="px-5 py-4 text-slate-600">{t.language}</td><td className="px-5 py-4 text-slate-600">{cats[t.category] || t.category}</td><td className="px-5 py-4 text-slate-600">{labels[t.status] || "Não disponível para envio"}</td><td className="px-5 py-4 text-slate-600">{t.qualityScore || "—"}</td><td className="px-5 py-4 text-slate-600">{t.whatsappAccount?.name || "—"}</td><td className="whitespace-nowrap px-5 py-4 text-slate-600">{date(t.lastSyncedAt)}</td><td className="px-5 py-4"><button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label={t.archivedAt ? "Restaurar" : "Arquivar"} onClick={() => void archive(t)}>{t.archivedAt || t.deletedAt ? <RotateCcw size={17} /> : <Archive size={17} />}</button></td></tr>{open && <tr><td colSpan={8} className="bg-slate-50 px-5 py-5 text-slate-600"><h2 className="font-semibold text-slate-900">Conteúdo e variáveis</h2>{t.headerText && <section className="mt-3"><b className="text-xs text-slate-500">Título</b><p>{t.headerText}</p></section>}<section className="mt-3"><b className="text-xs text-slate-500">Mensagem</b><p className="whitespace-pre-wrap">{t.body}</p></section>{t.footer && <section className="mt-3"><b className="text-xs text-slate-500">Rodapé</b><p>{t.footer}</p></section>}<div className="mt-4 grid gap-2">{t.variables.map((variable) => <article key={`${variable.component}-${variable.buttonIndex || 0}-${variable.position}`} className="rounded-xl border border-slate-200 bg-white p-3"><b>{variable.component} · variável {variable.position}</b><p>Tipo: {variable.type} · {variable.required ? "Obrigatória" : "Opcional"} · Ordem {variable.order}</p>{variable.example != null && <p>Exemplo: {String(variable.example)}</p>}</article>)}</div>{t.rejectionReason && <p className="mt-3 text-red-600">Motivo: {t.rejectionReason}</p>}</td></tr>}</>;
}
