"use client";

import {
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import Button from "@/components/ui/Button";
import type { WhatsappAccount } from "@/types/whatsapp";
import { WhatsAppEmptyState } from "@/components/whatsapp/WhatsAppEmptyState";

interface Props {
  accounts: WhatsappAccount[];
  loading: boolean;
  error: string;
  notice: string;
  canManage: boolean;
  isGlobalAdmin: boolean;
  connecting: boolean;
  busyId: string | null;
  onRefresh: () => void;
  onConnect: () => void;
  onManualConnect: () => void;
  onEdit: (account: WhatsappAccount) => void;
  onUpdateCredential: (account: WhatsappAccount) => void;
  onSync: (account: WhatsappAccount) => void;
  onTest: (account: WhatsappAccount) => void;
}

function formatDate(value?: string | null) {
  if (!value) return "Nunca";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: WhatsappAccount["status"]) {
  const labels: Record<WhatsappAccount["status"], string> = {
    ACTIVE: "Conectado",
    PENDING: "Configurando",
    INACTIVE: "Inativo",
    DISCONNECTED: "Desconectado",
    ERROR: "Com erro",
    SUSPENDED: "Suspenso",
  };

  return labels[status];
}

function statusClass(status: WhatsappAccount["status"]) {
  if (status === "ACTIVE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "PENDING") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

export function WhatsAppSetupSimple({
  accounts,
  loading,
  error,
  notice,
  canManage,
  isGlobalAdmin,
  connecting,
  busyId,
  onRefresh,
  onConnect,
  onManualConnect,
  onEdit,
  onUpdateCredential,
  onSync,
  onTest,
}: Props) {
  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            WhatsApp Business Platform
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            WhatsApp Oficial
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Conecte e gerencie seus números oficiais da Meta de forma simples.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Atualizar
          </Button>

          {isGlobalAdmin && (
            <Button variant="secondary" onClick={onManualConnect}>
              <Settings2 size={16} />
              Configuração manual
            </Button>
          )}

          {canManage && (
            <Button onClick={onConnect} loading={connecting}>
              <Plus size={16} />
              Conectar com Facebook
            </Button>
          )}
        </div>
      </header>

      {notice && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 className="mt-0.5 shrink-0" size={20} />

          <div>
            <strong className="block">Tudo certo</strong>
            <span className="text-sm">{notice}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertCircle className="mt-0.5 shrink-0" size={20} />

          <div>
            <strong className="block">
              Não foi possível carregar as contas
            </strong>

            <span className="text-sm">
              Verifique se o backend está iniciado e tente novamente.
            </span>
          </div>
        </div>
      )}

      {!loading && accounts.length === 0 && (
        <WhatsAppEmptyState
          canManage={canManage}
          isGlobalAdmin={isGlobalAdmin}
          connecting={connecting}
          onConnect={onConnect}
          onManualConnect={onManualConnect}
        />
      )}

      {loading && accounts.length === 0 && (
        <section
          aria-busy="true"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-60 animate-pulse rounded-3xl border border-slate-200 bg-slate-100"
            />
          ))}
        </section>
      )}

      {accounts.length > 0 && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => {
            const busy = busyId === account.id;

            return (
              <article
                key={account.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <MessageCircle size={24} />
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate font-bold text-slate-950">
                        {account.verifiedName ||
                          account.name ||
                          "WhatsApp Oficial"}
                      </h2>

                      <p className="mt-0.5 text-sm text-slate-500">
                        {account.displayPhoneNumber ||
                          account.phoneNumber ||
                          "Número não informado"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(
                      account.status,
                    )}`}
                  >
                    {statusLabel(account.status)}
                  </span>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <dt className="text-xs text-slate-500">Qualidade</dt>
                    <dd className="mt-1 font-bold text-slate-800">
                      {account.qualityRating || "Não informada"}
                    </dd>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <dt className="text-xs text-slate-500">Conta padrão</dt>
                    <dd className="mt-1 font-bold text-slate-800">
                      {account.isDefault ? "Sim" : "Não"}
                    </dd>
                  </div>

                  <div className="col-span-2 rounded-xl bg-slate-50 p-3">
                    <dt className="text-xs text-slate-500">
                      Última sincronização
                    </dt>
                    <dd className="mt-1 font-bold text-slate-800">
                      {formatDate(account.lastSyncAt)}
                    </dd>
                  </div>
                </dl>

                {account.lastConnectionError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {account.lastConnectionError}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => onSync(account)}
                    disabled={busy}
                  >
                    <RefreshCw
                      size={15}
                      className={busy ? "animate-spin" : ""}
                    />
                    Sincronizar
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => onTest(account)}
                    disabled={busy}
                  >
                    <ShieldCheck size={15} />
                    Testar
                  </Button>

                  {isGlobalAdmin && (
                    <Button
                      variant="secondary"
                      onClick={() => onEdit(account)}
                      disabled={busy}
                    >
                      Editar
                    </Button>
                  )}

                  {isGlobalAdmin && !account.tokenConfigured && (
                    <Button
                      variant="secondary"
                      onClick={() => onUpdateCredential(account)}
                      disabled={busy}
                    >
                      Atualizar token
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
