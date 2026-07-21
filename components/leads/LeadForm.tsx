"use client";
import { useState } from "react";
import { leadService } from "@/services/lead.service";
import { Lead, LeadFormData, LeadSource, LeadStatus, LeadTemperature } from "@/types/lead";
import { Organization } from "@/types/organization";
import { User } from "@/types/user";

const sources: LeadSource[] = ["MANUAL", "CSV_IMPORT", "META_ADS", "WEBSITE", "PUBLIC_API", "WEBHOOK", "REFERRAL", "ORGANIC", "FACEBOOK", "INSTAGRAM", "LANDING_PAGE", "PHONE", "OTHER"];
const statuses: LeadStatus[] = ["NEW", "ASSIGNED", "CONTACT_PENDING", "IN_CONTACT", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST", "ARCHIVED"];
const temperatures: LeadTemperature[] = ["UNKNOWN", "COLD", "WARM", "HOT"];

type Props = { lead?: Lead | null; organizations: Organization[]; users: User[]; onSuccess: () => void; onCancel: () => void };

export default function LeadForm({ lead, organizations, users, onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<LeadFormData>({ name: lead?.name ?? "", phone: lead?.phone ?? "", email: lead?.email ?? "", document: lead?.document ?? "", source: lead?.source ?? "MANUAL", status: lead?.status ?? "NEW", temperature: lead?.temperature ?? "UNKNOWN", organizationId: lead?.organizationId ?? organizations[0]?.id ?? "", assignedUserId: lead?.assignedUserId ?? "", managerUserId: lead?.managerUserId ?? "", notes: lead?.notes ?? "" });

  function update(field: keyof LeadFormData, value: string) { setForm((current) => ({ ...current, [field]: value })); }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.organizationId) { setError("Informe a organização."); return; }
    if (!form.phone?.trim() && !form.email?.trim()) { setError("Informe telefone ou e-mail. Integrações também podem criar leads por identidade externa via API."); return; }
    setLoading(true); setError("");
    const payload = { ...form, name: form.name?.trim() || null, phone: form.phone?.trim() || null, email: form.email?.trim() || null, document: form.document?.trim() || null, assignedUserId: form.assignedUserId || null, managerUserId: form.managerUserId || null, notes: form.notes?.trim() || null };
    try { if (lead?.id) await leadService.update(lead.id, payload); else await leadService.create(payload); onSuccess(); }
    catch (err) { setError(err instanceof Error ? err.message : "Erro ao salvar lead."); }
    finally { setLoading(false); }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><form onSubmit={submit} className="max-h-[90vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-xl bg-slate-900 p-6">
    <div><h2 className="text-2xl font-bold">{lead ? "Editar lead" : "Novo lead"}</h2><p className="text-sm text-slate-400">E-mail e nome são opcionais. Informe telefone ou e-mail no cadastro manual.</p></div>
    {error && <div className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">{error}</div>}
    <div className="grid gap-4 md:grid-cols-2">
      <input className="rounded-lg bg-slate-800 p-3" value={form.name ?? ""} onChange={(e) => update("name", e.target.value)} placeholder="Nome" />
      <input className="rounded-lg bg-slate-800 p-3" value={form.phone ?? ""} onChange={(e) => update("phone", e.target.value)} placeholder="Telefone" />
      <input className="rounded-lg bg-slate-800 p-3" type="email" value={form.email ?? ""} onChange={(e) => update("email", e.target.value)} placeholder="E-mail" />
      <input className="rounded-lg bg-slate-800 p-3" value={form.document ?? ""} onChange={(e) => update("document", e.target.value)} placeholder="Documento" />
      <select className="rounded-lg bg-slate-800 p-3" value={form.source} onChange={(e) => update("source", e.target.value)}>{sources.map((item) => <option key={item}>{item}</option>)}</select>
      <select className="rounded-lg bg-slate-800 p-3" value={form.status} onChange={(e) => update("status", e.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select>
      <select className="rounded-lg bg-slate-800 p-3" value={form.temperature} onChange={(e) => update("temperature", e.target.value)}>{temperatures.map((item) => <option key={item}>{item}</option>)}</select>
      <select className="rounded-lg bg-slate-800 p-3" value={form.organizationId} onChange={(e) => update("organizationId", e.target.value)} required><option value="">Organização *</option>{organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select>
      <select className="rounded-lg bg-slate-800 p-3" value={form.assignedUserId ?? ""} onChange={(e) => update("assignedUserId", e.target.value)}><option value="">Sem corretor responsável</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select>
      <select className="rounded-lg bg-slate-800 p-3" value={form.managerUserId ?? ""} onChange={(e) => update("managerUserId", e.target.value)}><option value="">Sem gerente</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select>
    </div>
    <textarea className="w-full rounded-lg bg-slate-800 p-3" rows={4} value={form.notes ?? ""} onChange={(e) => update("notes", e.target.value)} placeholder="Observações" />
    <div className="flex justify-end gap-3"><button type="button" onClick={onCancel} className="rounded-lg bg-slate-700 px-5 py-3">Cancelar</button><button disabled={loading} className="rounded-lg bg-blue-600 px-5 py-3 disabled:opacity-60">{loading ? "Salvando..." : "Salvar"}</button></div>
  </form></div>;
}
