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
    <article className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 truncate text-3xl font-bold tracking-tight text-slate-900">
            {formatNumber(value)}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>
    </article>
  );
}
