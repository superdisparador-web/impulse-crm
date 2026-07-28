"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  MessageCircleMore,
  Plus,
  X,
} from "lucide-react";
import {
  AccountFilters,
  AccountModal,
  AccountTable,
  AccountView,
  ArchiveModal,
} from "@/components/whatsapp";
import { whatsappService } from "@/services/whatsapp.service";
import {
  WhatsappAccount,
  WhatsappAccountFormData,
  WhatsappAccountStatus,
} from "@/types/whatsapp";

const statusLabels: Record<WhatsappAccountStatus, string> = {
  ACTIVE: "Ativa",
  INACTIVE: "Inativa",
  PENDING: "Pendente",
  ERROR: "Erro",
  DISCONNECTED: "Desconectada",
  SUSPENDED: "Suspensa",
};

const emptyForm: WhatsappAccountFormData = {
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

function formatDate(value?: string | null) {
  if (!value) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function generateVerifyToken() {
  const bytes = new Uint8Array(24);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join(
    "",
  );
}

function mask(value?: string | null) {
  if (!value) return "—";
  if (value.length <= 6) return "••••";
  return `${value.slice(0, 3)}••••${value.slice(-3)}`;
}

export default function WhatsappPage() {
  const [accounts, setAccounts] = useState<WhatsappAccount[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [state, setState] = useState<AccountView>("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<WhatsappAccount | null>(null);
  const [form, setForm] = useState<WhatsappAccountFormData>(emptyForm);
  const [confirmArchive, setConfirmArchive] = useState<WhatsappAccount | null>(
    null,
  );
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await whatsappService.getAccounts({
        search,
        status,
        state: state || undefined,
        page,
        pageSize,
      });
      setAccounts(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages || 1);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível carregar as contas WhatsApp.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, state, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (editing) firstInputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 5000);
    return () => window.clearTimeout(timer);
  }, [message]);

  function openForm(account?: WhatsappAccount) {
    setError("");
    setEditing(
      account ??
        ({
          id: "",
          organizationId: "",
          provider: "META_CLOUD",
          tokenConfigured: false,
          ...emptyForm,
          status: "PENDING",
          isDefault: false,
          normalizedPhone: "",
          createdAt: "",
          updatedAt: "",
          phoneNumber: "",
        } as WhatsappAccount),
    );
    setForm(
      account
        ? {
            name: account.name,
            phoneNumber: account.phoneNumber,
            wabaId: account.wabaId,
            businessAccountId: account.businessAccountId || "",
            phoneNumberId: account.phoneNumberId,
            credential: "",
            verifyToken: "",
            apiVersion: account.apiVersion || "v20.0",
            active: account.status === "ACTIVE",
          }
        : { ...emptyForm, verifyToken: generateVerifyToken() },
    );
  }

  function closeForm() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    addButtonRef.current?.focus();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      name: form.name.trim(),
      phoneNumber: form.phoneNumber?.trim(),
      wabaId: form.wabaId.trim(),
      businessAccountId: form.businessAccountId?.trim(),
      phoneNumberId: form.phoneNumberId.trim(),
      credential: form.credential?.trim(),
      apiVersion: form.apiVersion?.trim(),
    };
    if (
      !payload.name ||
      !payload.wabaId ||
      !payload.phoneNumberId ||
      (!editing?.id && !payload.credential)
    ) {
      setError(
        "Preencha nome interno, WABA ID, Phone Number ID e Access Token.",
      );
      setSaving(false);
      return;
    }
    try {
      if (editing?.id)
        await whatsappService.updateAccount(
          editing.id,
          payload.credential ? payload : { ...payload, credential: undefined },
        );
      else await whatsappService.createAccount(payload);
      setMessage("Conta WhatsApp salva com sucesso.");
      closeForm();
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível salvar a conta WhatsApp.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function runAction(
    id: string,
    action: () => Promise<unknown>,
    successMessage: string,
  ) {
    if (busyId) return;
    setBusyId(id);
    setError("");
    try {
      await action();
      setMessage(successMessage);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível concluir a ação.",
      );
    } finally {
      setBusyId(null);
    }
  }

  const activeOnPage = accounts.filter(
    (account) => account.status === "ACTIVE" && !account.deletedAt,
  ).length;
  const hasFilters = Boolean(search || status || state);
  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setState("");
    setPage(1);
  };

  return (
    <main className="space-y-6 text-slate-900">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <MessageCircleMore size={23} />
            </span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Contas WhatsApp
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Gerencie números conectados à API Oficial do WhatsApp Business
                Platform.
              </p>
            </div>
          </div>
          <div className="flex gap-4 text-xs text-slate-500">
            <span>
              <strong className="text-slate-900">{total}</strong>{" "}
              {total === 1 ? "conta" : "contas"}
            </span>
            <span>
              <strong className="text-emerald-700">{activeOnPage}</strong>{" "}
              ativas nesta página
            </span>
          </div>
        </div>
        <button
          ref={addButtonRef}
          type="button"
          onClick={() => openForm()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:w-auto"
        >
          <Plus size={18} />
          Conectar WhatsApp Oficial
        </button>
      </header>

      <div aria-live="polite" className="space-y-3">
        {message && (
          <div
            role="status"
            className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            <CheckCircle2 size={18} />
            <span className="flex-1">{message}</span>
            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Fechar mensagem de sucesso"
              className="rounded-lg p-1 hover:bg-emerald-100"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {error && !editing && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center"
          >
            <AlertCircle size={18} className="shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-red-200 bg-white px-3 py-2 font-semibold hover:bg-red-100"
            >
              Tentar novamente
            </button>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Fechar alerta"
              className="self-end rounded-lg p-1 hover:bg-red-100 sm:self-auto"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <AccountFilters
        search={search}
        status={status}
        state={state}
        statusLabels={statusLabels}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        onStateChange={(value) => {
          setState(value);
          setPage(1);
        }}
      />
      <AccountTable
        accounts={accounts}
        loading={loading}
        busyId={busyId}
        page={page}
        totalPages={totalPages}
        hasFilters={hasFilters}
        onPageChange={setPage}
        onConnect={() => openForm()}
        onClearFilters={clearFilters}
        onEdit={openForm}
        onTest={(account) =>
          void runAction(
            account.id,
            () => whatsappService.testAccount(account.id),
            "Conexão testada com sucesso.",
          )
        }
        onSync={(account) =>
          void runAction(
            account.id,
            () => whatsappService.syncAccount(account.id),
            "Conta sincronizada com sucesso.",
          )
        }
        onDefault={(account) =>
          void runAction(
            account.id,
            () => whatsappService.setDefault(account.id),
            "Conta definida como padrão.",
          )
        }
        onToggle={(account) =>
          void runAction(
            account.id,
            () =>
              whatsappService.updateStatus(
                account.id,
                account.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
              ),
            `Conta ${account.status === "ACTIVE" ? "desativada" : "ativada"} com sucesso.`,
          )
        }
        onArchive={setConfirmArchive}
        onRestore={(account) =>
          void runAction(
            account.id,
            () => whatsappService.restoreAccount(account.id),
            "Conta restaurada com sucesso.",
          )
        }
        formatDate={formatDate}
        mask={mask}
      />
      <AccountModal
        key={editing ? editing.id || "new" : "closed"}
        account={editing}
        form={form}
        saving={saving}
        error={editing ? error : ""}
        firstInputRef={firstInputRef}
        onChange={setForm}
        onGenerateVerifyToken={() =>
          setForm((current) => ({
            ...current,
            verifyToken: generateVerifyToken(),
          }))
        }
        onClose={closeForm}
        onSubmit={submit}
      />
      <ArchiveModal
        account={confirmArchive}
        saving={Boolean(confirmArchive && busyId === confirmArchive.id)}
        onCancel={() => setConfirmArchive(null)}
        onConfirm={() => {
          if (!confirmArchive) return;
          void runAction(
            confirmArchive.id,
            () => whatsappService.deleteAccount(confirmArchive.id),
            "Conta arquivada com sucesso.",
          ).then(() => setConfirmArchive(null));
        }}
      />
    </main>
  );
}
