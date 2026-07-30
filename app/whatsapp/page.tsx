"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConnectionsEnterprise } from "@/components/connections/ConnectionsEnterprise";
import { ArchiveModal } from "@/components/whatsapp";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getCurrentUser, isGlobalAdmin as hasGlobalAdminRole } from "@/services/auth";
import { whatsappService } from "@/services/whatsapp.service";
import type { WhatsappAccount, WhatsappAccountFormData } from "@/types/whatsapp";

const EMPTY: WhatsappAccountFormData = { name: "", phoneNumber: "", wabaId: "", businessAccountId: "", phoneNumberId: "", credential: "", verifyToken: "", apiVersion: "v20.0", active: true };
const friendlySignupErrors: Record<string, string> = {
  cancelled: "Login cancelado.", permission_denied: "Permissão não concedida.", no_business: "Nenhuma empresa selecionada.",
  no_waba: "Nenhuma conta WhatsApp selecionada.", phone_in_use: "Número já vinculado.", failed: "Não foi possível concluir a conexão.",
};

export default function WhatsappPage() {
  const [accounts, setAccounts] = useState<WhatsappAccount[]>([]), [total, setTotal] = useState(0), [loading, setLoading] = useState(true);
  const [error, setError] = useState(""), [notice, setNotice] = useState(""), [busyId, setBusyId] = useState<string | null>(null), [connecting, setConnecting] = useState(false);
  const [editing, setEditing] = useState<WhatsappAccount | null>(null), [archive, setArchive] = useState<WhatsappAccount | null>(null), [saving, setSaving] = useState(false), [formError, setFormError] = useState(""), [form, setForm] = useState<WhatsappAccountFormData>(EMPTY);
  const loadingRef = useRef(false);
  const role = getCurrentUser()?.role;
  const globalAdmin = useMemo(() => hasGlobalAdminRole() || role === "GLOBAL_ADMIN", [role]);
  const canManage = globalAdmin || role === "ORG_ADMIN";

  const load = useCallback(async (quiet = false) => { if (loadingRef.current) return; loadingRef.current = true; if (!quiet) setLoading(true); setError(""); try { const result = await whatsappService.getAccounts({ state: "all", page: 1, pageSize: 100 }); setAccounts(result.items); setTotal(result.total); } catch { setError("Não foi possível carregar as contas WhatsApp."); } finally { setLoading(false); loadingRef.current = false; } }, []);
  useEffect(() => { const initial = window.setTimeout(() => void load(), 0); const poll = window.setInterval(() => { if (document.visibilityState === "visible" && !busyId) void load(true); }, 60_000); return () => { window.clearTimeout(initial); window.clearInterval(poll); }; }, [busyId, load]);
  useEffect(() => { const timer = window.setTimeout(() => { const params = new URLSearchParams(window.location.search); const result = params.get("connection") ?? params.get("signup"); if (!result) return; if (result === "success") { setNotice("Conta conectada com sucesso. Números e templates foram sincronizados."); void load(true); } else setError(friendlySignupErrors[params.get("reason") ?? result] ?? friendlySignupErrors.failed); window.history.replaceState({}, "", "/whatsapp"); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function connect() { if (!canManage || connecting) return; setConnecting(true); setError(""); try { const session = await whatsappService.startEmbeddedSignup(); window.location.assign(session.authorizationUrl); } catch { setError("Não foi possível iniciar a conexão com a Meta. Tente novamente."); setConnecting(false); } }
  function openEdit(account: WhatsappAccount) { if (!globalAdmin) return; setEditing(account); setForm({ name: account.name, phoneNumber: account.phoneNumber, wabaId: account.wabaId, businessAccountId: account.businessAccountId ?? "", phoneNumberId: account.phoneNumberId, credential: "", verifyToken: "", apiVersion: account.apiVersion ?? "v20.0", active: account.status === "ACTIVE" }); }
  function closeEdit() { setEditing(null); setForm({ ...EMPTY }); setFormError(""); }
  async function submit(event: FormEvent) { event.preventDefault(); if (!editing?.id || !globalAdmin || saving) return; setSaving(true); setFormError(""); try { await whatsappService.updateAccount(editing.id, { name: form.name.trim(), phoneNumber: form.phoneNumber?.trim(), apiVersion: form.apiVersion?.trim() }); closeEdit(); setNotice("Configuração avançada atualizada."); await load(true); } catch { setFormError("Não foi possível atualizar a configuração."); } finally { setSaving(false); } }
  async function action(account: WhatsappAccount, operation: () => Promise<unknown>, success: string) { if (!canManage || busyId) return; setBusyId(account.id); setError(""); try { await operation(); setNotice(success); await load(true); } catch { setError("Não foi possível concluir a ação. Tente novamente."); } finally { setBusyId(null); } }

  return <>
    <ConnectionsEnterprise accounts={accounts} total={total} loading={loading} error={error} notice={notice} busyId={busyId} canManage={canManage} isGlobalAdmin={globalAdmin} connecting={connecting} onDismissNotice={() => setNotice("")} onRefresh={() => void load()} onConnect={() => void connect()} onEdit={openEdit} onArchive={setArchive} onTest={a => void action(a, () => whatsappService.testAccount(a.id), "Teste de conexão concluído.")} onSync={a => void action(a, () => whatsappService.syncAccount(a.id), "Conta, número e templates sincronizados.")} onToggle={a => void action(a, () => whatsappService.updateStatus(a.id, a.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"), "Status atualizado.")} onDefault={a => void action(a, () => whatsappService.setDefault(a.id), "Conta padrão atualizada.")} onRestore={a => void action(a, () => whatsappService.restoreAccount(a.id), "Conta restaurada.")}/>
    <Modal isOpen={Boolean(editing)} title="Editar conta" onClose={closeEdit}><form onSubmit={submit} className="space-y-4"><p className="text-sm text-slate-500">Edite somente informações operacionais. Identificadores e credenciais são administrados automaticamente pela integração.</p>{formError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{formError}</p>}<label className="block text-sm font-semibold">Nome interno<Input autoFocus value={form.name} onChange={e => setForm(current => ({ ...current, name: e.target.value }))} required/></label><label className="block text-sm font-semibold">Número exibido<Input value={form.phoneNumber} onChange={e => setForm(current => ({ ...current, phoneNumber: e.target.value }))}/></label><label className="block text-sm font-semibold">Versão da API<Input value={form.apiVersion} onChange={e => setForm(current => ({ ...current, apiVersion: e.target.value }))}/></label><div className="flex justify-end gap-2"><Button variant="secondary" onClick={closeEdit}>Cancelar</Button><Button type="submit" loading={saving}>Salvar</Button></div></form></Modal>
    <ArchiveModal account={archive} saving={Boolean(archive && busyId === archive.id)} onCancel={() => setArchive(null)} onConfirm={() => { if (!archive) return; const target = archive; void action(target, () => whatsappService.deleteAccount(target.id), "Conta arquivada.").then(() => setArchive(null)); }}/>
    <SignupProgress open={connecting}/>
  </>;
}

function SignupProgress({ open }: { open: boolean }) { const steps = ["Conectando com a Meta", "Autorização concluída", "Configurando sua conta", "Sincronizando número e templates", "Conta conectada com sucesso"]; return <Modal isOpen={open} title="Conectar WhatsApp Oficial" onClose={() => {}}><p className="text-sm text-slate-500">Você será direcionado ao ambiente seguro da Meta. Não será necessário copiar identificadores ou tokens.</p><ol className="mt-5 space-y-3">{steps.map((step, index) => <li key={step} className="flex items-center gap-3 text-sm"><span className={`grid h-7 w-7 place-items-center rounded-full font-bold ${index === 0 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{index + 1}</span>{step}</li>)}</ol></Modal>; }
