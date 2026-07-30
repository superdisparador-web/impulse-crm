"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConnectionsEnterprise } from "@/components/connections/ConnectionsEnterprise";
import { ArchiveModal } from "@/components/whatsapp";
import Modal from "@/components/ui/Modal";
import { getCurrentUser, isGlobalAdmin as hasGlobalAdminRole } from "@/services/auth";
import { whatsappService } from "@/services/whatsapp.service";
import type { WhatsappAccount } from "@/types/whatsapp";

const friendlySignupErrors: Record<string, string> = {
  cancelled: "Você cancelou a autorização.", permission_denied: "Sua conta não possui permissão para conectar este número.", no_business: "Não foi possível concluir a conexão.",
  no_waba: "Não foi possível concluir a conexão.", phone_in_use: "Este número já está conectado.", invalid_state: "Sua autorização expirou. Tente novamente.", missing_code: "Não foi possível concluir a conexão.", temporarily_unavailable: "Não foi possível concluir a conexão. Tente novamente.", failed: "Não foi possível concluir a conexão.",
};

export default function WhatsappPage() {
  const [accounts, setAccounts] = useState<WhatsappAccount[]>([]), [total, setTotal] = useState(0), [loading, setLoading] = useState(true);
  const [error, setError] = useState(""), [notice, setNotice] = useState(""), [busyId, setBusyId] = useState<string | null>(null), [connecting, setConnecting] = useState(false);
  const [archive, setArchive] = useState<WhatsappAccount | null>(null);
  const loadingRef = useRef(false);
  const role = getCurrentUser()?.role;
  const globalAdmin = useMemo(() => hasGlobalAdminRole() || role === "GLOBAL_ADMIN", [role]);
  const canManage = globalAdmin || role === "ORG_ADMIN";

  const load = useCallback(async (quiet = false) => { if (loadingRef.current) return; loadingRef.current = true; if (!quiet) setLoading(true); setError(""); try { const result = await whatsappService.getAccounts({ state: "all", page: 1, pageSize: 100 }); setAccounts(result.items); setTotal(result.total); } catch { setError("Não foi possível carregar as contas WhatsApp."); } finally { setLoading(false); loadingRef.current = false; } }, []);
  useEffect(() => { const initial = window.setTimeout(() => void load(), 0); const poll = window.setInterval(() => { if (document.visibilityState === "visible" && !busyId) void load(true); }, 60_000); return () => { window.clearTimeout(initial); window.clearInterval(poll); }; }, [busyId, load]);
  useEffect(() => { const timer = window.setTimeout(() => { const params = new URLSearchParams(window.location.search); const result = params.get("connection") ?? params.get("signup"); if (!result) return; if (result === "success") { setNotice("WhatsApp conectado com sucesso."); void load(true); } else setError(friendlySignupErrors[params.get("reason") ?? result] ?? friendlySignupErrors.failed); window.history.replaceState({}, "", "/whatsapp"); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function connect() { if (!canManage || connecting) return; setConnecting(true); setError(""); try { const session = await whatsappService.startEmbeddedSignup(); window.location.assign(session.authorizationUrl); } catch { setError("Não foi possível iniciar a conexão com a Meta. Tente novamente."); setConnecting(false); } }
  async function action(account: WhatsappAccount, operation: () => Promise<unknown>, success: string) { if (!canManage || busyId) return; setBusyId(account.id); setError(""); try { await operation(); setNotice(success); await load(true); } catch { setError("Não foi possível concluir a ação. Tente novamente."); } finally { setBusyId(null); } }

  return <>
    <ConnectionsEnterprise accounts={accounts} total={total} loading={loading} error={error} notice={notice} busyId={busyId} canManage={canManage} isGlobalAdmin={globalAdmin} connecting={connecting} onDismissNotice={() => setNotice("")} onRefresh={() => void load()} onConnect={() => void connect()} onEdit={() => undefined} onArchive={setArchive} onTest={a => void action(a, () => whatsappService.testAccount(a.id), "Conexão verificada com sucesso.")} onSync={a => void action(a, () => whatsappService.syncAccount(a.id), "Dados do WhatsApp atualizados.")} onToggle={a => void action(a, () => whatsappService.updateStatus(a.id, a.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"), "Situação atualizada.")} onDefault={a => void action(a, () => whatsappService.setDefault(a.id), "Canal principal atualizado.")} onRestore={a => void action(a, () => whatsappService.restoreAccount(a.id), "Conta restaurada.")}/>
    <ArchiveModal account={archive} saving={Boolean(archive && busyId === archive.id)} onCancel={() => setArchive(null)} onConfirm={() => { if (!archive) return; const target = archive; void action(target, () => whatsappService.deleteAccount(target.id), "Conta arquivada.").then(() => setArchive(null)); }}/>
    <SignupProgress open={connecting}/>
  </>;
}

function SignupProgress({ open }: { open: boolean }) { const steps = ["Conectando com a Meta", "Autorização concluída", "Configurando sua conta", "Sincronizando número e templates", "Conta conectada com sucesso"]; return <Modal isOpen={open} title="Conectar WhatsApp Oficial" onClose={() => {}}><p className="text-sm text-slate-500">Você será direcionado ao ambiente seguro da Meta. Não será necessário copiar identificadores ou tokens.</p><ol className="mt-5 space-y-3">{steps.map((step, index) => <li key={step} className="flex items-center gap-3 text-sm"><span className={`grid h-7 w-7 place-items-center rounded-full font-bold ${index === 0 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{index + 1}</span>{step}</li>)}</ol></Modal>; }
