import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { HTMLAttributes, ReactNode } from "react";

type Tone = "error" | "warning" | "success" | "info";
const tones = {
  error: { icon: AlertCircle, classes: "border-red-200 bg-red-50 text-red-800" },
  warning: { icon: AlertTriangle, classes: "border-amber-200 bg-amber-50 text-amber-800" },
  success: { icon: CheckCircle2, classes: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  info: { icon: Info, classes: "border-blue-200 bg-blue-50 text-blue-800" },
};

export default function StatusAlert({ tone = "info", title, children, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { tone?: Tone; title?: string; children: ReactNode }) {
  const meta = tones[tone], Icon = meta.icon;
  return <div role={tone === "error" || tone === "warning" ? "alert" : "status"} {...props} className={`flex items-start gap-3 rounded-2xl border p-4 text-sm shadow-[0_8px_24px_-20px_rgba(15,23,42,.3)] transition-[opacity,transform] duration-200 ${meta.classes} ${className}`}><Icon className="mt-0.5 shrink-0" size={18} /><div className="min-w-0">{title && <strong className="mb-0.5 block font-semibold">{title}</strong>}<div className="leading-5">{children}</div></div></div>;
}
