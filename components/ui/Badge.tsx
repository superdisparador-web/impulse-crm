import { HTMLAttributes } from "react";

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple"
  | "neutral"
  | "orange"
  | "green"
  | "red"
  | "yellow"
  | "blue"
  | "gray"
  | "outline";

const variants: Record<BadgeVariant, string> = {
  default:
    "bg-slate-100 text-slate-700 border border-slate-200",

  primary:
    "bg-blue-100 text-blue-700 border border-blue-200",

  secondary:
    "bg-violet-100 text-violet-700 border border-violet-200",

  success:
    "bg-emerald-100 text-emerald-700 border border-emerald-200",

  warning:
    "bg-amber-100 text-amber-700 border border-amber-200",

  danger:
    "bg-red-100 text-red-700 border border-red-200",

  info:
    "bg-cyan-100 text-cyan-700 border border-cyan-200",

  purple:
    "bg-violet-100 text-violet-700 border border-violet-200",

  neutral:
    "bg-slate-100 text-slate-700 border border-slate-200",

  orange:
    "bg-orange-100 text-orange-700 border border-orange-200",

  green:
    "bg-green-100 text-green-700 border border-green-200",

  red:
    "bg-red-100 text-red-700 border border-red-200",

  yellow:
    "bg-yellow-100 text-yellow-700 border border-yellow-200",

  blue:
    "bg-blue-100 text-blue-700 border border-blue-200",

  gray:
    "bg-gray-100 text-gray-700 border border-gray-200",

  outline:
    "bg-transparent text-slate-700 border border-slate-300",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export default function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={joinClasses(
        "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}