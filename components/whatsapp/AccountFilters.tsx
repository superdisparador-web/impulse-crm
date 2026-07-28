"use client";

import { Check, Clipboard, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { WhatsappAccountStatus } from "@/types/whatsapp";

export type AccountView = "active" | "inactive" | "archived" | "all" | "";

interface AccountFiltersProps {
  search: string;
  status: string;
  state: AccountView;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onStateChange: (value: AccountView) => void;
  statusLabels: Record<WhatsappAccountStatus, string>;
}

const field =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100";
const webhookPath = "/webhooks/meta/whatsapp";

export function AccountFilters({
  search,
  status,
  state,
  onSearchChange,
  onStatusChange,
  onStateChange,
  statusLabels,
}: AccountFiltersProps) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      aria-label="Webhook e filtros das contas"
    >
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-700">URL do webhook</p>
          <p className="mt-1 text-xs text-slate-500">
            Endpoint do backend para configurar no painel da Meta.
          </p>
          <code className="mt-2 block truncate rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
            {webhookPath}
          </code>
        </div>
        <button
          type="button"
          onClick={() =>
            void navigator.clipboard
              .writeText(webhookPath)
              .then(() => setCopied(true))
          }
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
          aria-live="polite"
        >
          {copied ? (
            <Check size={16} className="text-emerald-600" />
          ) : (
            <Clipboard size={16} />
          )}
          {copied ? "URL copiada" : "Copiar URL"}
        </button>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr]">
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="account-search"
        >
          Buscar conta
          <div className="relative mt-1.5">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={17}
            />
            <input
              id="account-search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className={`${field} pl-10`}
              placeholder="Nome, número, WABA ID ou Phone Number ID"
            />
          </div>
        </label>
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="account-status"
        >
          Status
          <select
            id="account-status"
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className={`${field} mt-1.5`}
          >
            <option value="">Todos os status</option>
            {Object.keys(statusLabels).map((value) => (
              <option key={value} value={value}>
                {statusLabels[value as WhatsappAccountStatus]}
              </option>
            ))}
          </select>
        </label>
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="account-view"
        >
          Visão
          <select
            id="account-view"
            value={state}
            onChange={(event) =>
              onStateChange(event.target.value as AccountView)
            }
            className={`${field} mt-1.5`}
          >
            <option value="">Não arquivadas</option>
            <option value="active">Ativas</option>
            <option value="inactive">Inativas</option>
            <option value="archived">Arquivadas</option>
            <option value="all">Todas</option>
          </select>
        </label>
      </div>
    </section>
  );
}
