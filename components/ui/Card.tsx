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
        border-slate-200
        bg-white
        shadow-sm
        transition
        duration-200
        hover:shadow-md
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}