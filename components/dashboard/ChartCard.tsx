import { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

export default function ChartCard({
  title,
  children,
}: ChartCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.35)] transition-all duration-200 hover:border-blue-200/70 hover:shadow-[0_16px_36px_-24px_rgba(37,99,235,0.24)] sm:p-6">
      <h2 className="mb-5 text-lg font-semibold tracking-[-0.015em] text-slate-900">
        {title}
      </h2>

      <div className="space-y-4">
        {children}
      </div>
    </article>
  );
}
