"use client";

import {
  Bell,
  ChevronDown,
  Search,
  UserCircle2,
} from "lucide-react";

export default function Header() {
  return (
    <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6">
      <div className="relative hidden w-full max-w-md md:block">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />

        <input
          type="search"
          aria-label="Pesquisar no Impulse CRM"
          placeholder="Pesquisar leads, campanhas e usuários..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          aria-label="Abrir notificações"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100"
        >
          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <button
          type="button"
          aria-label="Abrir menu do usuário"
          className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
        >
          <UserCircle2
            className="shrink-0 text-slate-700"
            size={34}
          />

          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold text-slate-900">
              Rodrigo Lopes
            </p>

            <p className="truncate text-xs text-slate-500">
              Superintendência
            </p>
          </div>

          <ChevronDown
            className="hidden shrink-0 text-slate-400 sm:block"
            size={16}
          />
        </button>
      </div>
    </header>
  );
}
