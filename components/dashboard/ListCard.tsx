import { ReactNode } from "react";
import EmptyState from "./EmptyState";

interface ListCardProps {
  title: string;
  emptyMessage: string;
  children: ReactNode;
  hasItems: boolean;
}

export default function ListCard({
  title,
  emptyMessage,
  children,
  hasItems,
}: ListCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold text-slate-900">
        {title}
      </h2>

      {hasItems ? (
        <div className="divide-y divide-slate-100">
          {children}
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState message={emptyMessage} />
        </div>
      )}
    </article>
  );
}
