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
    <article className="rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.35)] transition duration-200 hover:border-slate-300 hover:shadow-md sm:p-6">
      <h2 className="mb-5 text-lg font-semibold text-slate-900">
        {title}
      </h2>

      <div className="space-y-4">
        {children}
      </div>
    </article>
  );
}
