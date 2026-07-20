"use client";

import { FormEvent, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Organization } from "@/types/organization";
import { User, UserFormData, UserRole } from "@/types/user";

interface UserFormProps { user?: User | null; organizations: Organization[]; saving: boolean; onCancel: () => void; onSubmit: (data: UserFormData) => Promise<void>; }

export default function UserForm({ user, organizations, saving, onCancel, onSubmit }: UserFormProps) {
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<UserFormData>({ name: user?.name ?? "", email: user?.email ?? "", password: "", phone: user?.phone ?? "", role: user?.role ?? "CORRETOR", organizationId: user?.organizationId ?? "", active: user?.active ?? true });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.organizationId) return setError("Preencha nome, e-mail e organização.");
    if (!user && (!formData.password || formData.password.length < 6)) return setError("A senha deve ter pelo menos 6 caracteres.");
    setError("");
    await onSubmit({ ...formData, name: formData.name.trim(), email: formData.email.trim(), phone: formData.phone?.trim() || undefined, password: user ? undefined : formData.password });
  }

  return <form className="space-y-5" onSubmit={handleSubmit}>
    {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
    <Input label="Nome" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required />
    <div className="grid gap-5 md:grid-cols-2"><Input label="E-mail" type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} required />{!user && <Input label="Senha" type="password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} required minLength={6} />}</div>
    <Input label="Telefone" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} placeholder="(11) 99999-9999" />
    <div className="grid gap-5 md:grid-cols-2"><Select label="Organização" value={formData.organizationId} onChange={(event) => setFormData({ ...formData, organizationId: event.target.value })} options={[{ label: "Selecione", value: "" }, ...organizations.map((organization) => ({ label: organization.name, value: organization.id }))]} required /><Select label="Papel" value={formData.role} onChange={(event) => setFormData({ ...formData, role: event.target.value as UserRole })} options={[{ label: "Administrador", value: "ADMIN" }, { label: "Corretor", value: "CORRETOR" }]} /></div>
    <Select label="Status" value={String(formData.active)} onChange={(event) => setFormData({ ...formData, active: event.target.value === "true" })} options={[{ label: "Ativo", value: "true" }, { label: "Inativo", value: "false" }]} />
    <div className="flex justify-end gap-3 border-t border-slate-700 pt-6"><Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button></div>
  </form>;
}
