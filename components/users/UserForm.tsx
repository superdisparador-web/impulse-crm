"use client";

import { FormEvent, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Organization } from "@/types/organization";
import { User, UserFormData, UserRole } from "@/types/user";

interface Props { user?: User | null; organizations: Organization[]; saving: boolean; canAssignOrganizations: boolean; allowedRoles: UserRole[]; onCancel: () => void; onSubmit: (data: UserFormData) => Promise<void>; }
const labels: Record<UserRole, string> = { GLOBAL_ADMIN: "Administrador global", ADMIN: "Administrador", ORG_ADMIN: "Administrador da organização", MANAGER: "Gerente", CORRETOR: "Corretor", BROKER: "Corretor" };

export default function UserForm({ user, organizations, saving, canAssignOrganizations, allowedRoles, onCancel, onSubmit }: Props) {
  const [error, setError] = useState("");
  const [form, setForm] = useState<UserFormData>({ name: user?.name ?? "", email: user?.email ?? "", password: "", phone: user?.phone ?? "", role: user?.role ?? allowedRoles.at(-1) ?? "CORRETOR", organizationId: user?.organizationId ?? "", active: user?.active ?? true });
  const field = <K extends keyof UserFormData>(key: K, value: UserFormData[K]) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) { event.preventDefault(); if (!form.name.trim()) return setError("Informe o nome completo."); if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Informe um e-mail válido."); if (!user && (!form.password || form.password.length < 8)) return setError("A senha temporária deve ter ao menos 8 caracteres."); if (canAssignOrganizations && !form.organizationId && !["ADMIN", "GLOBAL_ADMIN"].includes(form.role)) return setError("Selecione a organização."); setError(""); await onSubmit({ ...form, name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone?.trim() || undefined, password: user ? undefined : form.password }); }
  return <form onSubmit={submit} className="space-y-6">
    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-6 text-blue-800">Cadastre somente pessoas autorizadas. A senha temporária deve ser compartilhada por um canal seguro.</div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="grid gap-5 sm:grid-cols-2"><div className="sm:col-span-2"><Input label="Nome completo" value={form.name} onChange={(e) => field("name", e.target.value)} required /></div><Input label="E-mail" type="email" value={form.email} onChange={(e) => field("email", e.target.value)} required /><Input label="Telefone" value={form.phone} onChange={(e) => field("phone", e.target.value)} placeholder="(11) 99999-9999" />{!user && <div className="sm:col-span-2"><Input label="Senha temporária" type="password" value={form.password} onChange={(e) => field("password", e.target.value)} minLength={8} required /></div>}
      <Select label="Função" value={form.role} onChange={(e) => field("role", e.target.value as UserRole)} options={allowedRoles.map((role) => ({ value: role, label: labels[role] }))} />
      <Select label="Status" value={String(form.active)} onChange={(e) => field("active", e.target.value === "true")} options={[{ value: "true", label: "Ativo" }, { value: "false", label: "Inativo" }]} />
      {canAssignOrganizations ? <div className="sm:col-span-2"><Select label="Organização" value={form.organizationId} onChange={(e) => field("organizationId", e.target.value)} options={[{ value: "", label: "Escopo global / selecione" }, ...organizations.map((o) => ({ value: o.id, label: o.name }))]} /></div> : <p className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">A organização será definida automaticamente conforme o seu escopo.</p>}
    </div>
    <div className="flex justify-end gap-3 border-t border-slate-200 pt-5"><Button variant="secondary" onClick={onCancel}>Cancelar</Button><Button type="submit" loading={saving}>{user ? "Salvar alterações" : "Criar usuário"}</Button></div>
  </form>;
}
