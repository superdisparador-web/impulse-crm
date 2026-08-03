"use client";

import { Bell, Menu, Search } from "lucide-react";

export default function Header({ onOpenMenu, mobileMenuOpen }: { onOpenMenu: () => void; mobileMenuOpen: boolean }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b ds-border ds-canvas px-4 backdrop-blur-xl sm:px-6">
      <button type="button" onClick={onOpenMenu} aria-label="Abrir menu lateral" aria-controls="primary-sidebar" aria-expanded={mobileMenuOpen} className="ui-focus ds-radius-control p-2 text-slate-300 transition-colors ds-secondary-hover hover:text-white lg:hidden">
        <Menu size={22} aria-hidden="true" />
      </button>
      <label className="relative hidden w-96 max-w-full sm:block">
        <span className="sr-only">Pesquisar no CRM</span>
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />

        <input
          type="text"
          placeholder="Pesquisar..."
          aria-label="Pesquisar no CRM"
          className="ui-control w-full py-2 pl-10 pr-12 text-sm placeholder:text-slate-500"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border ds-border ds-surface-raised px-1.5 py-0.5 text-[10px] text-slate-500 xl:block">⌘ K</kbd>
      </label>

      <div className="flex items-center gap-2 sm:gap-3">
        <button type="button" className="ui-focus relative grid h-9 w-9 place-items-center ds-radius-control text-slate-400 transition-colors ds-secondary-hover hover:text-slate-100" aria-label="Notificações">
          <Bell className="text-slate-300" size={22} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-sky-400 ring-2 ring-slate-950"></span>
        </button>

        <div className="hidden items-center gap-2.5 border-l ds-border pl-3 md:flex">
          <span className="grid h-8 w-8 place-items-center rounded-full border ds-border bg-gradient-to-br from-slate-700 to-blue-950 text-[10px] font-bold text-slate-100 shadow-sm">RL</span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-100">
              Rodrigo Lopes
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              Superintendência
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
