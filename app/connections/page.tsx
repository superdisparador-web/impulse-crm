"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ConnectionsEnterprise } from "@/components/connections/ConnectionsEnterprise";
import { AccountModal, ArchiveModal } from "@/components/whatsapp";
import { getCurrentUser, isGlobalAdmin } from "@/services/auth";
import { whatsappService } from "@/services/whatsapp.service";
import type { WhatsappAccount, WhatsappAccountFormData } from "@/types/whatsapp";

const EMPTY: WhatsappAccountFormData = {
  name: "",
  phoneNumber: "",
  wabaId: "",
  businessAccountId: "",
  phoneNumberId: "",
  credential: "",
  verifyToken: "",
  apiVersion: "v20.0",
  active: true,
};

export default function ConnectionsPage() {
  const [accounts, setAccounts] = useState<WhatsappAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [total, setTotal] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<WhatsappAccount | null>(null);
  const [archive, setArchive] = useState<WhatsappAccount | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<WhatsappAccountFormData>(EMPTY);
  const [formError, setFormError] = useState("");
  const firstInputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef(0);
  const loadingRef = useRef(false);
  const canManage = useMemo(() => {
    const role = getCurrentUser()?.role;
    return isGlobalAdmin() || role === "GLOBAL_ADMIN" || role === "ORG_ADMIN";
  }, []);

  const load = useCallback(async (quiet = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    const request = ++requestRef.current;
    if (!quiet) setLoading(true);
    setError("");
    try {
      const result = await whatsappService.getAccounts({
        state: "all",
        page: 1,
        pageSize: 100,
      });
      if (request !== requestRef.current) return;
      setAccounts(result.items);
      setTotal(result.total);
      setLastUpdated(new Date());
    } catch (reason) {
      if (request === requestRef.current)
        setError(
          reason instanceof Error
            ? reason.message
            : "Backend de conexões indisponível.",
        );
    } finally {
      if (request === requestRef.current) setLoading(false);
      loadingRef.current = false;
    }
  }, []);
  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible" && !editing && !busyId)
        void load(true);
    }, 60_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(poll);
      requestRef.current += 1;
    };
  }, [busyId, editing, load]);

  function openForm(account?: WhatsappAccount) {
    if (!canManage) return;
    setFormError("");
    setEditing(account ?? ({ id: "", organizationId: "", provider: "META_CLOUD", status: "PENDING", isDefault: false, tokenConfigured: false, normalizedPhone: "", phoneNumber: "", createdAt: "", updatedAt: "", ...EMPTY } as WhatsappAccount));
    setForm(account ? { name: account.name, phoneNumber: account.phoneNumber, wabaId: account.wabaId, businessAccountId: account.businessAccountId ?? "", phoneNumberId: account.phoneNumberId, credential: "", verifyToken: "", apiVersion: account.apiVersion ?? "v20.0", active: account.status === "ACTIVE" } : { ...EMPTY, verifyToken: crypto.getRandomValues(new Uint32Array(4)).join("") });
  }
  function closeForm() { setEditing(null); setForm({ ...EMPTY }); setFormError(""); document.getElementById("new-connection-button")?.focus(); }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (saving || !canManage) return;
    const payload = { ...form, name: form.name.trim(), wabaId: form.wabaId.trim(), phoneNumberId: form.phoneNumberId.trim(), credential: form.credential?.trim(), verifyToken: form.verifyToken?.trim() };
    if (!payload.name || !payload.wabaId || !payload.phoneNumberId || (!editing?.id && !payload.credential)) { setFormError("Preencha nome, WABA ID, Phone Number ID e Access Token."); return; }
    setSaving(true); setFormError("");
    try { if (editing?.id) await whatsappService.updateAccount(editing.id, payload.credential ? payload : { ...payload, credential: undefined }); else await whatsappService.createAccount(payload); closeForm(); setNotice("Conexão salva com segurança."); await load(true); }
    catch (reason) { setFormError(reason instanceof Error ? reason.message : "Não foi possível salvar a conexão."); }
    finally { setSaving(false); setForm(current => ({ ...current, credential: "", verifyToken: "" })); }
  }
  async function action(account: WhatsappAccount, operation: () => Promise<unknown>, success: string) { if (busyId || !canManage) return; setBusyId(account.id); setError(""); try { await operation(); setNotice(success); await load(true); } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível concluir a operação."); } finally { setBusyId(null); } }

  return <>
      <ConnectionsEnterprise
        accounts={accounts}
        total={total}
        loading={loading}
        error={error}
        notice={notice}
        lastUpdated={lastUpdated}
        busyId={busyId}
        canManage={canManage}
        onDismissNotice={() => setNotice("")}
        onRefresh={() => void load()}
        onCreate={() => openForm()}
        onEdit={openForm}
        onArchive={setArchive}
        onTest={(account) =>
          void action(
            account,
            () => whatsappService.testAccount(account.id),
            "Teste de conexão concluído com sucesso.",
          )
        }
        onSync={(account) =>
          void action(
            account,
            () => whatsappService.syncAccount(account.id),
            "Sincronização concluída.",
          )
        }
        onToggle={(account) =>
          void action(
            account,
            () =>
              whatsappService.updateStatus(
                account.id,
                account.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
              ),
            "Status atualizado.",
          )
        }
      />
      <AccountModal
        key={editing?.id ?? "closed"}
        account={editing}
        form={form}
        saving={saving}
        error={formError}
        firstInputRef={firstInputRef}
        onChange={setForm}
        onGenerateVerifyToken={() =>
          setForm((current) => ({
            ...current,
            verifyToken: crypto.getRandomValues(new Uint32Array(4)).join(""),
          }))
        }
        onClose={closeForm}
        onSubmit={submit}
      />
      <ArchiveModal
        account={archive}
        saving={Boolean(archive && busyId === archive.id)}
        onCancel={() => setArchive(null)}
        onConfirm={() => {
          if (!archive) return;
          const target = archive;
          void action(
            target,
            () => whatsappService.deleteAccount(target.id),
            "Conexão arquivada.",
          ).then(() => setArchive(null));
        }}
      />
    </>;
}
