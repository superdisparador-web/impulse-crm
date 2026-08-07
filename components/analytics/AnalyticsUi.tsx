import { ReactNode } from "react";
import { AlertCircle, LoaderCircle } from "lucide-react";

export function AnalyticsHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-6 text-white shadow-xl sm:p-8 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.24em] text-blue-200">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">
          {description}
        </p>
      </div>
      {actions}
    </header>
  );
}
export function AnalyticsCard({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_-24px_rgba(15,23,42,.35)] sm:p-6 ${className}`}
    >
      {title && (
        <h2 className="mb-5 text-lg font-bold text-slate-900">{title}</h2>
      )}
      {children}
    </section>
  );
}
export function LoadingState({
  label = "Carregando indicadores...",
}: {
  label?: string;
}) {
  return (
    <div
      className="flex min-h-56 items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-500"
      aria-live="polite"
      aria-busy="true"
    >
      <LoaderCircle className="mr-3 animate-spin text-blue-600" />
      {label}
    </div>
  );
}
export function ErrorState({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"
    >
      <AlertCircle />
      {message}
    </div>
  );
}
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
export function RateBadge({ value }: { value: number }) {
  return (
    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
      {value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%
    </span>
  );
}
export function DateRange({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (field: "from" | "to", value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="text-xs font-semibold text-slate-500">
        De
        <input
          aria-label="Data inicial"
          type="date"
          value={from}
          onChange={(event) => onChange("from", event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
        />
      </label>
      <label className="text-xs font-semibold text-slate-500">
        Até
        <input
          aria-label="Data final"
          type="date"
          value={to}
          onChange={(event) => onChange("to", event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
        />
      </label>
    </div>
  );
}
