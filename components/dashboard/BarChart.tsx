interface BarChartProps {
  label: string;
  value: number;
  max: number;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export default function BarChart({ label, value, max }: BarChartProps) {
  const percentage =
    value === 0 ? 0 : Math.max(4, (value / Math.max(max, 1)) * 100);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="truncate text-slate-600">{label}</span>

        <span className="font-semibold text-slate-900">
          {formatNumber(value)}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
