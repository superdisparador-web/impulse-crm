"use client";

import { useState } from "react";
import { api } from "@/services/api";

export type LeadData = {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  source?: string;
  campaign?: string;
  neighborhood?: string;
  income?: number;
  interestProject?: string;
  notes?: string;
};

type Props = {
  lead?: LeadData;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function LeadForm({
  lead,
  onSuccess,
  onCancel,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: lead?.name ?? "",
    phone: lead?.phone ?? "",
    email: lead?.email ?? "",
    city: lead?.city ?? "",
    source: lead?.source ?? "",
    campaign: lead?.campaign ?? "",
    neighborhood: lead?.neighborhood ?? "",
    income: lead?.income?.toString() ?? "",
    interestProject: lead?.interestProject ?? "",
    notes: lead?.notes ?? "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);

    try {
      const payload: Record<string, any> = {
        name: form.name.trim(),
        phone: form.phone.trim(),
      };

      if (form.email.trim())
        payload.email = form.email.trim();

      if (form.city.trim())
        payload.city = form.city.trim();

      if (form.source.trim())
        payload.source = form.source.trim();

      if (form.campaign.trim())
        payload.campaign = form.campaign.trim();

      if (form.neighborhood.trim())
        payload.neighborhood = form.neighborhood.trim();

      if (form.interestProject.trim())
        payload.interestProject =
          form.interestProject.trim();

      if (form.notes.trim())
        payload.notes = form.notes.trim();

      if (form.income.trim())
        payload.income = Number(form.income);

      if (lead?.id) {
        await api(`/leads/${lead.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/leads", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      onSuccess();
    } catch (error) {
      console.error(error);
      alert(
        lead?.id
          ? "Erro ao atualizar lead."
          : "Erro ao cadastrar lead."
      );
    } finally {
      setLoading(false);
    }
  }

  return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">

  <form
    onSubmit={handleSubmit}
    className="w-full max-w-2xl rounded-xl bg-slate-900 p-8 space-y-5"
  >

    <h2 className="text-2xl font-bold">
      {lead ? "Editar Lead" : "Novo Lead"}
    </h2>

    <p className="text-sm text-slate-400">
      <span className="text-red-400">*</span>{" "}
      Campos obrigatórios:
      <strong> Nome</strong> e
      <strong> Telefone</strong>.
    </p>

    <div className="grid grid-cols-2 gap-4">

      <input
        name="name"
        placeholder="Nome *"
        required
        value={form.name}
        onChange={handleChange}
        className="rounded-lg bg-slate-800 p-3"
      />

      <input
        name="phone"
        placeholder="Telefone *"
        required
        value={form.phone}
        onChange={handleChange}
        className="rounded-lg bg-slate-800 p-3"
      />

      <input
        name="email"
        type="email"
        placeholder="E-mail"
        value={form.email}
        onChange={handleChange}
        className="rounded-lg bg-slate-800 p-3"
      />

      <input
        name="city"
        placeholder="Cidade"
        value={form.city}
        onChange={handleChange}
        className="rounded-lg bg-slate-800 p-3"
      />

      <input
        name="source"
        placeholder="Origem"
        value={form.source}
        onChange={handleChange}
        className="rounded-lg bg-slate-800 p-3"
      />

      <input
        name="campaign"
        placeholder="Campanha"
        value={form.campaign}
        onChange={handleChange}
        className="rounded-lg bg-slate-800 p-3"
      />

      <input
        name="neighborhood"
        placeholder="Bairro"
        value={form.neighborhood}
        onChange={handleChange}
        className="rounded-lg bg-slate-800 p-3"
      />

      <input
        name="income"
        type="number"
        placeholder="Renda"
        value={form.income}
        onChange={handleChange}
        className="rounded-lg bg-slate-800 p-3"
      />

    </div>

    <input
      name="interestProject"
      placeholder="Empreendimento de interesse"
      value={form.interestProject}
      onChange={handleChange}
      className="w-full rounded-lg bg-slate-800 p-3"
    />

    <textarea
      name="notes"
      rows={5}
      placeholder="Observações"
      value={form.notes}
      onChange={handleChange}
      className="w-full rounded-lg bg-slate-800 p-3"
    />

    <div className="flex justify-end gap-3">

      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg bg-slate-700 px-5 py-3"
      >
        Cancelar
      </button>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-blue-600 px-5 py-3 hover:bg-blue-700 disabled:opacity-60"
      >
        {loading
          ? lead
            ? "Atualizando..."
            : "Salvando..."
          : lead
          ? "Atualizar Lead"
          : "Salvar Lead"}
      </button>

    </div>

  </form>

</div>
);
}