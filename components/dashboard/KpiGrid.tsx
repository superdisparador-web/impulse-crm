import { ReactNode } from "react";
import KpiCard from "./KpiCard";

export interface DashboardKpi {
  label: string;
  value: number;
  icon: ReactNode;
}

interface KpiGridProps {
  items: DashboardKpi[];
}

export default function KpiGrid({ items }: KpiGridProps) {
  return (
    <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {items.map((item) => (
        <KpiCard
          key={item.label}
          label={item.label}
          value={item.value}
          icon={item.icon}
        />
      ))}
    </section>
  );
}
