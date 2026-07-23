import { Lead } from "@/types/lead";
import { formatDateTime, translateStatus, translateTemperature } from "./lead360-utils";

function InfoRow({ label, value, copyable = false }: { label: string; value?: string | null; copyable?: boolean }) {
  if (!value) return null;
  return <div className="rounded-xl border border-slate-800 p-3"><dt className="text-xs uppercase text-slate-500">{label}</dt><dd className="mt-1 text-sm text-slate-100">{copyable ? <button onClick={() => void navigator.clipboard?.writeText(value)} className="text-left text-blue-300 hover:text-blue-200">{value}</button> : value}</dd></div>;
}

export function LeadInfo({ lead }: { lead: Lead }) {
  return <section className="space-y-3"><h3 className="text-lg font-semibold text-white">Informações do Lead</h3><dl className="grid gap-3 sm:grid-cols-2"><InfoRow label="Nome" value={lead.name} /><InfoRow label="Telefone" value={lead.phone} copyable /><InfoRow label="E-mail" value={lead.email} copyable /><InfoRow label="CPF" value={lead.document} /><InfoRow label="Origem" value={lead.source} /><InfoRow label="Temperatura" value={translateTemperature(lead.temperature)} /><InfoRow label="Status" value={translateStatus(lead.status)} /><InfoRow label="Data de cadastro" value={formatDateTime(lead.createdAt)} /><InfoRow label="Última atualização" value={formatDateTime(lead.updatedAt)} /></dl></section>;
}
