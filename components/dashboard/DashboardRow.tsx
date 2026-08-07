interface DashboardRowProps {
  title: string;
  meta: string;
  value: string;
}

export default function DashboardRow({
  title,
  meta,
  value,
}: DashboardRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-900">{title}</p>

        <p className="mt-1 truncate text-sm text-slate-500">{meta}</p>
      </div>

      <span className="shrink-0 text-right text-sm font-medium text-slate-600">
        {value}
      </span>
    </div>
  );
}
