"use client";

import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  onClose: (id: string) => void;
}

const styles = {
  success: {
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
    border: "border-emerald-200",
    bg: "bg-white",
  },
  error: {
    icon: AlertCircle,
    iconColor: "text-red-600",
    border: "border-red-200",
    bg: "bg-white",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-600",
    border: "border-amber-200",
    bg: "bg-white",
  },
  info: {
    icon: Info,
    iconColor: "text-sky-600",
    border: "border-sky-200",
    bg: "bg-white",
  },
};

export default function Toast({
  id,
  type,
  title,
  description,
  onClose,
}: ToastProps) {
  const config = styles[type];
  const Icon = config.icon;

  return (
    <div
      className={`
        w-[360px]
        rounded-2xl
        border
        ${config.border}
        ${config.bg}
        shadow-xl
        p-4
        animate-in
        slide-in-from-right
        duration-300
      `}
    >
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-6 w-6 ${config.iconColor}`} />

        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">{title}</h3>

          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>

        <button
          onClick={() => onClose(id)}
          className="rounded-lg p-1 hover:bg-slate-100"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
