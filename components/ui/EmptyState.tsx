import { ReactNode } from "react";
import Image from "next/image";

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
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center sm:px-6 sm:py-12">
      <div className="relative mb-5 h-32 w-full max-w-52">
        <Image
          src="/branding/empty-state.png"
          alt=""
          fill
          sizes="208px"
          className="object-contain"
        />
        {icon && (
          <div className="absolute bottom-0 right-2 flex h-11 w-11 items-center justify-center rounded-xl border border-white bg-white text-blue-600 shadow-md">
            {icon}
          </div>
        )}
      </div>

      <h3 className="text-base font-semibold text-slate-900">
        {title}
      </h3>

      {description && (
        <p className="mt-1 max-w-md text-sm text-slate-500">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </div>
  );
}
