"use client";

import { Bell, Search, UserCircle2 } from "lucide-react";

export default function Header() {
  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6">
      <div className="relative w-96">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />

        <input
          type="text"
          placeholder="Pesquisar..."
          className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-5">
        <button className="relative">
          <Bell className="text-slate-600" size={22} />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        <div className="flex items-center gap-3">
          <UserCircle2 className="text-slate-700" size={34} />

          <div>
            <p className="font-semibold text-slate-800">
              Rodrigo Lopes
            </p>

            <p className="text-sm text-slate-500">
              Superintendência
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}