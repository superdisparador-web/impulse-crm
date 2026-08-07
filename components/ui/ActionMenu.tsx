"use client";

import { Archive, Eye, KanbanSquare, MoreVertical, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ActionMenuProps {
  disabled?: boolean;
  onView: () => void;
  onEdit: () => void;
  onAddToPipeline: () => void;
  onArchive: () => void;
}

export default function ActionMenu({
  disabled = false,
  onView,
  onEdit,
  onAddToPipeline,
  onArchive,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function execute(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div ref={menuRef} className="relative inline-flex">
      <button
        type="button"
        aria-label="Abrir menu de ações"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <button
            type="button"
            onClick={() => execute(onView)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <Eye size={16} />
            Visualizar 360°
          </button>

          <button
            type="button"
            onClick={() => execute(onEdit)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <Pencil size={16} />
            Editar
          </button>

          <button
            type="button"
            onClick={() => execute(onAddToPipeline)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <KanbanSquare size={16} />
            Adicionar ao Pipeline
          </button>

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            disabled={disabled}
            onClick={() => execute(onArchive)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Archive size={16} />
            Arquivar
          </button>
        </div>
      )}
    </div>
  );
}
