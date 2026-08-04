"use client";

import { FormEvent, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Organization, OrganizationFormData } from "@/types/organization";

interface OrganizationFormProps {
  organization?: Organization | null;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (data: OrganizationFormData) => Promise<void>;
}

export default function OrganizationForm({ organization, saving, onCancel, onSubmit }: OrganizationFormProps) {
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: organization?.name ?? "",
    document: organization?.document ?? "",
    email: organization?.email ?? "",
    phone: organization?.phone ?? "",
    active: organization?.active ?? true,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      ...formData,
      name: formData.name.trim(),
      document: formData.document?.trim() || undefined,
      email: formData.email?.trim() || undefined,
      phone: formData.phone?.trim() || undefined,
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <Input label="Nome da empresa" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} placeholder="Impulse CRM" required maxLength={255} />
      <div className="grid gap-5 md:grid-cols-2">
        <Input label="Documento" value={formData.document} onChange={(event) => setFormData({ ...formData, document: event.target.value })} placeholder="CNPJ ou CPF" maxLength={32} />
        <Input label="Telefone" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} placeholder="(11) 99999-9999" maxLength={32} />
      </div>
      <Input label="E-mail" type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} placeholder="contato@empresa.com" maxLength={255} />
      <Select label="Status" value={String(formData.active)} onChange={(event) => setFormData({ ...formData, active: event.target.value === "true" })} options={[{ label: "Ativa", value: "true" }, { label: "Inativa", value: "false" }]} />
      <div className="flex justify-end gap-3 border-t border-slate-700 pt-6">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </form>
  );
}
