import { HTMLAttributes, ReactNode } from "react";

type CampaignSurfaceProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  as?: "section" | "div" | "aside";
  padding?: "none" | "compact" | "default";
};

const paddings = { none: "", compact: "p-4", default: "p-4 sm:p-6" };

/** Shared light surface for campaign workflows. Keeps borders, motion and elevation consistent. */
export default function CampaignSurface({
  children,
  as: Element = "section",
  padding = "default",
  className = "",
  ...props
}: CampaignSurfaceProps) {
  return (
    <Element
      {...props}
      className={`rounded-2xl border border-slate-200/90 bg-white shadow-[0_12px_32px_-24px_rgba(15,23,42,.3)] transition-[border-color,box-shadow,transform] duration-200 ${paddings[padding]} ${className}`}
    >
      {children}
    </Element>
  );
}
