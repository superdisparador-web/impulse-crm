import { HTMLAttributes, ReactNode } from "react";

function join(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function PageContainer({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <main className={join("ds-page", className)} {...props} />;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="ui-page-title">{title}</h1>{description && <p className="ui-page-description">{description}</p>}</div>
      {actions && <div className="ds-toolbar">{actions}</div>}
    </header>
  );
}

export function Section({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={join("ds-section", className)} {...props} />;
}

export function Surface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={join("ui-card", className)} {...props} />;
}

export const Card = Surface;
export const Panel = Surface;

export function Toolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={join("ds-toolbar", className)} {...props} />;
}

export function Alert({ children, tone = "info", className, ...props }: HTMLAttributes<HTMLDivElement> & { tone?: "info" | "success" | "danger" }) {
  const tones = { info: "border-sky-900/70 bg-sky-950/30 text-sky-100", success: "border-emerald-900/70 bg-emerald-950/30 text-emerald-100", danger: "border-red-900/70 bg-red-950/30 text-red-100" };
  return <div role={tone === "danger" ? "alert" : "status"} className={join("ds-alert", tones[tone], className)} {...props}>{children}</div>;
}

export function EmptyState({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={join("ds-radius-control border border-dashed ds-border bg-black/10 p-6 text-center text-sm text-slate-400", className)} {...props}>{children}</div>;
}

export function TableContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={join("ds-table", className)} {...props} />;
}
