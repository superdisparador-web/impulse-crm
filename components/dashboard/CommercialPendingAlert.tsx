"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { distributionCommercialService } from "@/services/distribution-commercial.service";
import { DistributionMetrics } from "@/types/distribution-commercial";
export default function CommercialPendingAlert() {
  const [data, setData] = useState<DistributionMetrics>();
  useEffect(() => {
    let active = true;
    distributionCommercialService
      .metrics()
      .then((value) => {
        if (active) setData(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  if (!data?.overdue) return null;
  return (
    <aside
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900"
      role="status"
    >
      <div>
        <strong>{data.overdue} lead(s) aguardando atualização</strong>
        <p className="text-sm">
          Responda o acompanhamento comercial para manter o SLA.
        </p>
      </div>
      <Link
        href="/leads/received"
        className="rounded-xl bg-amber-700 px-4 py-2 font-semibold text-white"
      >
        Revisar pendências
      </Link>
    </aside>
  );
}
