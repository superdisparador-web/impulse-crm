import { WhatsappAccountStatus } from "@/types/whatsapp";

const labels: Record<WhatsappAccountStatus, string> = {
  ACTIVE: "Ativa",
  INACTIVE: "Inativa",
  PENDING: "Pendente",
  ERROR: "Erro",
  DISCONNECTED: "Desconectada",
  SUSPENDED: "Suspensa",
};

const statusStyles: Record<WhatsappAccountStatus, string> = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  INACTIVE: "border-slate-200 bg-slate-100 text-slate-600",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  ERROR: "border-red-200 bg-red-50 text-red-700",
  DISCONNECTED: "border-orange-200 bg-orange-50 text-orange-700",
  SUSPENDED: "border-violet-200 bg-violet-50 text-violet-700",
};

export function StatusBadge({ status }: { status: WhatsappAccountStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
