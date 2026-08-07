import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-[radial-gradient(circle_at_top,_#eff6ff,_rgba(248,250,252,0.72)_55%,_transparent)] px-4 py-10 text-center sm:px-6 sm:py-14">
      <div className="relative mb-5 h-36 w-full max-w-56 drop-shadow-[0_16px_24px_rgba(37,99,235,0.12)]">
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-[url('/branding/empty-state.png')] bg-contain bg-center bg-no-repeat"
        />
        {icon && (
          <div className="absolute bottom-0 right-2 flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600 shadow-lg shadow-blue-900/10">
            {icon}
          </div>
        )}
      </div>

      <h3 className="text-lg font-semibold tracking-[-0.015em] text-slate-900">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
