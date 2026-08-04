"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConnectionsEnterprise } from "@/components/connections/ConnectionsEnterprise";
import { AccessTokenModal, ArchiveModal, ManualAccountModal } from "@/components/whatsapp";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getCurrentUser, isGlobalAdmin as hasGlobalAdminRole } from "@/services/auth";
import { whatsappService } from "@/services/whatsapp.service";
import { organizationService } from "@/services/organization.service";
import type { Organization } from "@/types/organization";
import type { ManualWhatsappAccountFormData, WhatsappAccount, WhatsappAccountFormData } from "@/types/whatsapp";

const EMPTY: WhatsappAccountFormData = { name: "", phoneNumber: "", wabaId: "", businessAccountId: "", phoneNumberId: "", credential: "", verifyToken: "", apiVersion: "v20.0", active: true };
const EMPTY_MANUAL: ManualWhatsappAccountFormData = { organizationId: "", name: "", wabaId: "", phoneNumberId: "", businessAccountId: "", accessToken: "", apiVersion: "v23.0", isDefault: false };
const friendlySignupErrors: Record<string, string> = {
  cancelled: "Login cancelado.", permission_denied: "Permissão não concedida.", no_business: "Nenhuma empresa selecionada.",
  no_waba: "Nenhuma conta WhatsApp selecionada.", phone_in_use: "Número já vinculado.", failed: "Não foi possível concluir a conexão.",
};

const META_NOT_CONFIGURED = "A integração com a Meta ainda não foi configurada pelo administrador.";
const BACKEND_UNAVAILABLE = "Não foi possível acessar o servidor. Verifique se o backend está iniciado.";
const META_REJECTED = "A Meta não autorizou o início da conexão. Verifique as configurações do aplicativo.";

export function embeddedSignupErrorMessage(error: unknown) {
  if (error instanceof TypeError) return BACKEND_UNAVAILABLE;
  const cause = error instanceof Error ? error.message : String(error);
  if (/META_EMBEDDED_SIGNUP_NOT_CONFIGURED|não foi configurada|configuração de conexão com a Meta é inválida/i.test(cause)) return META_NOT_CONFIGURED;
  return META_REJECTED;
}

export function manualAccountErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("WHATSAPP_ACCOUNT_DUPLICATE_PHONE")) return "Esta conta já está cadastrada para a organização selecionada.";
  if (message.includes("WHATSAPP_ACCOUNT_ALREADY_LINKED")) return "Este número já está vinculado a outra organização.";
  if (message.includes("WHATSAPP_INVALID_ACCESS_TOKEN")) return "O access token foi recusado pela Meta.";
  if (message.includes("WHATSAPP_INSUFFICIENT_PERMISSION")) return "O token não possui as permissões necessárias na Meta.";
  if (message.includes("WHATSAPP_PHONE_NOT_FOUND_IN_WABA")) return "O Phone Number ID não pertence à WABA informada.";
  if (message.includes("WHATSAPP_WABA_NOT_OWNED_BY_BUSINESS")) return "A WABA não pertence ao Business Account informado.";
  if (message.includes("WHATSAPP_MANUAL_ACCOUNT_GLOBAL_ADMIN_ONLY")) return "Somente um administrador global pode fazer o cadastro manual.";
  return "Não foi possível validar a conta na Meta. Revise os identificadores e a credencial.";
}

export function accessTokenErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("WHATSAPP_INVALID_ACCESS_TOKEN")) return "O Access Token informado é inválido ou expirou.";
  if (message.includes("WHATSAPP_INSUFFICIENT_PERMISSION")) return "O token não possui as permissões necessárias para essa conta.";
  if (message.includes("WHATSAPP_PHONE_NOT_FOUND_IN_WABA")) return "O número configurado não foi encontrado na conta WhatsApp informada.";
  if (message.includes("WHATSAPP_META_REQUEST_TIMEOUT")) return "A Meta demorou para responder. Tente novamente.";
  return "A Meta não conseguiu validar a credencial.";
}

export default function WhatsappPage() {
  const [accounts, setAccounts] = useState<WhatsappAccount[]>([]), [total, setTotal] = useState(0), [loading, setLoading] = useState(true);
  const [error, setError] = useState(""), [notice, setNotice] = useState(""), [busyId, setBusyId] = useState<string | null>(null), [connecting, setConnecting] = useState(false);
  const [editing, setEditing] = useState<WhatsappAccount | null>(null), [archive, setArchive] = useState<WhatsappAccount | null>(null), [saving, setSaving] = useState(false), [formError, setFormError] = useState(""), [form, setForm] = useState<WhatsappAccountFormData>(EMPTY);
  const [manualOpen, setManualOpen] = useState(false), [manualSaving, setManualSaving] = useState(false), [manualError, setManualError] = useState(""), [manualForm, setManualForm] = useState<ManualWhatsappAccountFormData>(EMPTY_MANUAL), [organizations, setOrganizations] = useState<Organization[]>([]);
  const [credentialAccount, setCredentialAccount] = useState<WhatsappAccount | null>(null), [credentialSaving, setCredentialSaving] = useState(false), [credentialError, setCredentialError] = useState("");
  const loadingRef = useRef(false);
  const role = getCurrentUser()?.role;
  const globalAdmin = useMemo(() => hasGlobalAdminRole() || role === "GLOBAL_ADMIN", [role]);
  const canManage = globalAdmin || role === "ORG_ADMIN";

  const load = useCallback(async (quiet = false) => { if (loadingRef.current) return; loadingRef.current = true; if (!quiet) setLoading(true); setError(""); try { const result = await whatsappService.getAccounts({ state: "all", page: 1, pageSize: 100 }); setAccounts(result.items); setTotal(result.total); } catch { setError("Não foi possível carregar as contas WhatsApp."); } finally { setLoading(false); loadingRef.current = false; } }, []);
  useEffect(() => { const initial = window.setTimeout(() => void load(), 0); const poll = window.setInterval(() => { if (document.visibilityState === "visible" && !busyId) void load(true); }, 60_000); return () => { window.clearTimeout(initial); window.clearInterval(poll); }; }, [busyId, load]);
  useEffect(() => { const timer = window.setTimeout(() => { const params = new URLSearchParams(window.location.search); const code = params.get("code"), state = params.get("state"); if (code && state) { setConnecting(true); whatsappService.completeEmbeddedSignup(code, state).then(() => { setNotice("Conta conectada com sucesso. Números e templates foram sincronizados."); return load(true); }).catch(() => setError(friendlySignupErrors.failed)).finally(() => setConnecting(false)); window.history.replaceState({}, "", "/whatsapp"); return; } const result = params.get("connection") ?? params.get("signup"); if (!result) return; if (result === "success") { setNotice("Conta conectada com sucesso. Números e templates foram sincronizados."); void load(true); } else setError(friendlySignupErrors[params.get("reason") ?? result] ?? friendlySignupErrors.failed); window.history.replaceState({}, "", "/whatsapp"); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function connect() { if (!canManage || connecting) return; setConnecting(true); setError(""); try { const session = await whatsappService.startEmbeddedSignup(); window.location.assign(session.authorizationUrl); } catch (cause) { if (process.env.NODE_ENV !== "production") console.error("[WhatsApp Embedded Signup] Não foi possível criar a sessão:", cause); setError(embeddedSignupErrorMessage(cause)); setConnecting(false); } }
  async function openManual() { if (!globalAdmin) return; setManualError(""); setManualOpen(true); try { const result = await organizationService.getAll({ page: 1, limit: 100, active: true }); setOrganizations(result.items); } catch { setManualError("Não foi possível carregar as organizações ativas."); } }
  function closeManual() { if (manualSaving) return; setManualOpen(false); setManualForm({ ...EMPTY_MANUAL }); setManualError(""); }
  async function submitManual(event: FormEvent) { event.preventDefault(); if (!globalAdmin || manualSaving) return; setManualSaving(true); setManualError(""); try { await whatsappService.createManualAccount({ ...manualForm, name: manualForm.name.trim(), wabaId: manualForm.wabaId.trim(), phoneNumberId: manualForm.phoneNumberId.trim(), businessAccountId: manualForm.businessAccountId?.trim() || undefined, accessToken: manualForm.accessToken.trim(), apiVersion: manualForm.apiVersion?.trim() }); setManualOpen(false); setManualForm({ ...EMPTY_MANUAL }); setNotice("Conta validada na Meta e cadastrada com segurança."); await load(true); } catch (cause) { setManualError(manualAccountErrorMessage(cause)); } finally { setManualSaving(false); } }
  function openEdit(account: WhatsappAccount) { if (!globalAdmin) return; setEditing(account); setForm({ name: account.name, phoneNumber: account.phoneNumber, wabaId: account.wabaId, businessAccountId: account.businessAccountId ?? "", phoneNumberId: account.phoneNumberId, credential: "", verifyToken: "", apiVersion: account.apiVersion ?? "v20.0", active: account.status === "ACTIVE" }); }
  function closeEdit() { setEditing(null); setForm({ ...EMPTY }); setFormError(""); }
  async function submit(event: FormEvent) { event.preventDefault(); if (!editing?.id || !globalAdmin || saving) return; setSaving(true); setFormError(""); try { await whatsappService.updateAccount(editing.id, { name: form.name.trim(), phoneNumber: form.phoneNumber?.trim(), apiVersion: form.apiVersion?.trim() }); closeEdit(); setNotice("Configuração avançada atualizada."); await load(true); } catch { setFormError("Não foi possível atualizar a configuração."); } finally { setSaving(false); } }
  function openCredential(account: WhatsappAccount) { if (!globalAdmin) return; setCredentialError(""); setCredentialAccount(account); }
  function closeCredential() { if (credentialSaving) return; setCredentialAccount(null); setCredentialError(""); }
  async function submitCredential(accessToken: string) { if (!credentialAccount || !globalAdmin || credentialSaving) return; setCredentialSaving(true); setCredentialError(""); try { await whatsappService.updateAccessToken(credentialAccount.id, accessToken); setCredentialAccount(null); setNotice("Credencial atualizada e conta validada com sucesso."); await load(true); } catch (cause) { setCredentialError(accessTokenErrorMessage(cause)); } finally { setCredentialSaving(false); } }
  async function action(account: WhatsappAccount, operation: () => Promise<unknown>, success: string) { if (!canManage || busyId) return; setBusyId(account.id); setError(""); try { await operation(); setNotice(success); await load(true); } catch { setError("Não foi possível concluir a ação. Tente novamente."); } finally { setBusyId(null); } }

  return <>
    <ConnectionsEnterprise accounts={accounts} total={total} loading={loading} error={error} notice={notice} busyId={busyId} canManage={canManage} isGlobalAdmin={globalAdmin} connecting={connecting} onDismissNotice={() => setNotice("")} onRefresh={() => void load()} onConnect={() => void connect()} onManualConnect={() => void openManual()} onEdit={openEdit} onUpdateCredential={openCredential} onArchive={setArchive} onTest={a => void action(a, () => whatsappService.testAccount(a.id), "Teste de conexão concluído.")} onSync={a => void action(a, () => whatsappService.syncAccount(a.id), "Conta, número e templates sincronizados.")} onToggle={a => void action(a, () => whatsappService.updateStatus(a.id, a.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"), "Status atualizado.")} onDefault={a => void action(a, () => whatsappService.setDefault(a.id), "Conta padrão atualizada.")} onRestore={a => void action(a, () => whatsappService.restoreAccount(a.id), "Conta restaurada.")}/>
    {credentialAccount && <AccessTokenModal account={credentialAccount} saving={credentialSaving} error={credentialError} onClose={closeCredential} onSubmit={submitCredential}/>}
    {manualOpen && <ManualAccountModal open form={manualForm} organizations={organizations} saving={manualSaving} error={manualError} onChange={setManualForm} onClose={closeManual} onSubmit={submitManual}/>}
    <Modal isOpen={Boolean(editing)} title="Editar conta" onClose={closeEdit}><form onSubmit={submit} className="space-y-4"><p className="text-sm text-slate-500">Edite somente informações operacionais. Identificadores e credenciais são administrados automaticamente pela integração.</p>{formError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{formError}</p>}<label className="block text-sm font-semibold">Nome interno<Input autoFocus value={form.name} onChange={e => setForm(current => ({ ...current, name: e.target.value }))} required/></label><label className="block text-sm font-semibold">Número exibido<Input value={form.phoneNumber} onChange={e => setForm(current => ({ ...current, phoneNumber: e.target.value }))}/></label><label className="block text-sm font-semibold">Versão da API<Input value={form.apiVersion} onChange={e => setForm(current => ({ ...current, apiVersion: e.target.value }))}/></label><div className="flex justify-end gap-2"><Button variant="secondary" onClick={closeEdit}>Cancelar</Button><Button type="submit" loading={saving}>Salvar</Button></div></form></Modal>
    <ArchiveModal account={archive} saving={Boolean(archive && busyId === archive.id)} onCancel={() => setArchive(null)} onConfirm={() => { if (!archive) return; const target = archive; void action(target, () => whatsappService.deleteAccount(target.id), "Conta arquivada.").then(() => setArchive(null)); }}/>
    <SignupProgress open={connecting}/>
  </>;
}

function SignupProgress({ open }: { open: boolean }) { const steps = ["Conectando com a Meta", "Autorização concluída", "Configurando sua conta", "Sincronizando número e templates", "Conta conectada com sucesso"]; return <Modal isOpen={open} title="Conectar WhatsApp Oficial" onClose={() => {}}><p className="text-sm text-slate-500">Você será direcionado ao ambiente seguro da Meta. Não será necessário copiar identificadores ou tokens.</p><ol className="mt-5 space-y-3">{steps.map((step, index) => <li key={step} className="flex items-center gap-3 text-sm"><span className={`grid h-7 w-7 place-items-center rounded-full font-bold ${index === 0 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{index + 1}</span>{step}</li>)}</ol></Modal>; }
