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
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.35)] transition-all duration-200 before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-blue-600 before:via-cyan-400 before:to-transparent before:opacity-70 before:content-[''] hover:-translate-y-0.5 hover:border-blue-200/80 hover:shadow-[0_16px_34px_-20px_rgba(37,99,235,0.3)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 truncate text-3xl font-bold tracking-tight text-slate-900">
            {formatNumber(value)}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 shadow-sm transition-transform duration-200 group-hover:scale-105">
          {icon}
        </div>
      </div>
    </article>
  );
}
