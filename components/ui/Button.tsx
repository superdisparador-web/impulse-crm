"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "success";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  fullWidth?: boolean;
}

const variants = {
  primary:
    "border border-blue-500/50 ds-primary text-white shadow-sm shadow-blue-950/20 hover:bg-blue-500",

  secondary:
    "border border-slate-600/70 ds-surface-raised text-slate-100 hover:border-slate-500 ds-secondary-hover",

  danger:
    "border border-red-500/40 bg-red-600 text-white hover:bg-red-500",

  success:
    "border border-emerald-500/40 bg-emerald-600 text-white hover:bg-emerald-500",
};

export default function Button({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`
        ui-focus inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)]
        px-5 py-2.5 text-sm font-semibold
        transition-[color,background-color,border-color,box-shadow,transform]
        active:translate-y-px
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${variants[variant]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
