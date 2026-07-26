import { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: number;
  icon: ReactNode;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export default function KpiCard({
  label,
  value,
  icon,
}: KpiCardProps) {
  return (
    <article className="group relative min-h-32 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_12px_32px_-20px_rgba(15,23,42,0.32)] ring-1 ring-white/80 transition-all duration-200 before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-gradient-to-r before:from-blue-600 before:via-blue-400 before:to-cyan-300 before:content-[''] hover:-translate-y-0.5 hover:border-blue-200/90 hover:shadow-[0_18px_38px_-20px_rgba(37,99,235,0.32)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-5 text-slate-500">
            {label}
          </p>

          <p className="mt-2 truncate text-3xl font-bold tracking-tight text-slate-900">
            {formatNumber(value)}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-100/90 bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 shadow-[0_8px_20px_-12px_rgba(37,99,235,0.55)] transition-transform duration-200 group-hover:scale-105">
          {icon}
        </div>
      </div>
    </article>
  );
}
