import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({
  children,
  padding = "md",
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={`
        rounded-2xl
        border
        border-slate-200/80
        bg-white/95
        shadow-[0_1px_3px_rgba(15,23,42,0.04),0_10px_28px_-20px_rgba(15,23,42,0.2)]
        transition
        duration-200
        hover:border-slate-300/80
        hover:shadow-[0_12px_32px_-20px_rgba(15,23,42,0.28)]
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
