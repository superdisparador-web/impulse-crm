import { ReactNode } from "react";

export default function SmartphoneMockup({
  children,
  compact = true,
  label = "Simulação da mensagem em um smartphone",
}: {
  children: ReactNode;
  compact?: boolean;
  label?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`relative mx-auto w-full overflow-hidden border-[7px] border-slate-900 bg-slate-900 shadow-[0_28px_70px_-28px_rgba(15,23,42,.65)] transition-[width,transform,box-shadow] duration-200 ${compact ? "max-w-[390px] rounded-[2.75rem]" : "max-w-[760px] rounded-[2rem]"}`}
    >
      <div
        aria-hidden="true"
        className={`absolute left-1/2 top-1.5 z-20 h-5 -translate-x-1/2 rounded-full bg-slate-950 shadow-sm ${compact ? "w-24" : "w-32"}`}
      />
      <div
        className={`relative overflow-hidden bg-white ${compact ? "aspect-[9/18.8] min-h-[620px] rounded-[2.25rem]" : "min-h-[540px] rounded-[1.45rem]"}`}
      >
        {children}
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2 left-1/2 z-20 h-1 w-24 -translate-x-1/2 rounded-full bg-white/80"
      />
    </div>
  );
}
