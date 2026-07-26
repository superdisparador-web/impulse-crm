"use client";

import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export default function SearchBar({
  value,
  placeholder = "Pesquisar...",
  onChange,
}: SearchBarProps) {
  return (
    <div className="relative w-full">
      <Search
        size={20}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white/95 pl-12 pr-12 text-sm text-slate-800 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:shadow-md focus:ring-4 focus:ring-blue-500/10"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
