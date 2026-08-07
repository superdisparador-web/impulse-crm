"use client";

import { useEffect, useRef, useState } from "react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";

import { leadService } from "@/services/lead.service";

import {
  Lead,
  LeadFormData,
  LeadSource,
  LeadStatus,
  LeadTemperature,
} from "@/types/lead";
import { User } from "@/types/user";

import {
  leadSourceLabels,
  leadStatusLabels,
  leadTemperatureLabels,
} from "./lead-labels";

const sources = Object.keys(leadSourceLabels) as LeadSource[];

const statuses = Object.keys(leadStatusLabels) as LeadStatus[];

const temperatures = Object.keys(leadTemperatureLabels) as LeadTemperature[];

type Props = {
  lead?: Lead | null;
  users: User[];
  onSuccess: (lead: Lead) => void;
  onCancel: () => void;
};

const onlyDigits = (value?: string | null) => value?.replace(/\D/g, "") || "";

const inputClasses =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100";

export default function LeadForm({ lead, users, onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<LeadFormData>({
    name: lead?.name ?? "",
    phone: lead?.phone ?? "",
    email: lead?.email ?? "",
    document: lead?.document ?? "",
    source: lead?.source ?? "MANUAL",
    status: lead?.status ?? "NEW",
    temperature: lead?.temperature ?? "UNKNOWN",
    assignedUserId: lead?.assignedUserId ?? "",
    managerUserId: lead?.managerUserId ?? "",
    notes: lead?.notes ?? "",
  });

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  function update(field: keyof LeadFormData, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const email = form.email?.trim() ?? "";

    if (!form.name?.trim() && !form.phone?.trim() && !email) {
      setError("Informe pelo menos nome, telefone ou e-mail.");
      return;
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Informe um e-mail válido.");
      return;
    }

    setLoading(true);
    setError("");

    const payload: LeadFormData = {
      ...form,
      name: form.name?.trim() || null,
      phone: onlyDigits(form.phone) || null,
      email: email || null,
      document: onlyDigits(form.document) || null,
      assignedUserId: form.assignedUserId || null,
      managerUserId: form.managerUserId || null,
      notes: form.notes?.trim() || null,
    };

    try {
      const saved = lead?.id
        ? await leadService.update(lead.id, payload)
        : await leadService.create(payload);

      onSuccess(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar lead.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen
      title={lead ? "Editar Lead" : "Novo Lead"}
      onClose={() => {
        if (!loading) {
          onCancel();
        }
      }}
      width="lg"
    >
      <form onSubmit={submit} className="space-y-6">
        <div>
          <p className="text-sm text-slate-500">
            Informe pelo menos nome, telefone ou e-mail para cadastrar o lead.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <Input
            ref={nameRef}
            label="Nome"
            placeholder="Nome completo"
            value={form.name ?? ""}
            onChange={(event) => update("name", event.target.value)}
          />

          <Input
            label="Telefone"
            placeholder="(11) 99999-9999"
            value={form.phone ?? ""}
            onChange={(event) => update("phone", event.target.value)}
          />

          <Input
            label="E-mail"
            type="email"
            placeholder="cliente@email.com"
            value={form.email ?? ""}
            onChange={(event) => update("email", event.target.value)}
          />

          <Input
            label="CPF ou documento"
            placeholder="000.000.000-00"
            value={form.document ?? ""}
            onChange={(event) => update("document", event.target.value)}
          />

          <Select
            label="Origem"
            value={form.source}
            onChange={(event) => update("source", event.target.value)}
            options={sources.map((item) => ({
              value: item,
              label: leadSourceLabels[item],
            }))}
          />

          <Select
            label="Status"
            value={form.status}
            onChange={(event) => update("status", event.target.value)}
            options={statuses.map((item) => ({
              value: item,
              label: leadStatusLabels[item],
            }))}
          />

          <Select
            label="Temperatura"
            value={form.temperature}
            onChange={(event) => update("temperature", event.target.value)}
            options={temperatures.map((item) => ({
              value: item,
              label: leadTemperatureLabels[item],
            }))}
          />

          <Select
            label="Corretor responsável"
            value={form.assignedUserId ?? ""}
            onChange={(event) => update("assignedUserId", event.target.value)}
            options={[
              {
                value: "",
                label: "Sem corretor",
              },
              ...users.map((user) => ({
                value: user.id,
                label: user.name,
              })),
            ]}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Observação inicial
          </label>

          <textarea
            className={inputClasses}
            rows={4}
            placeholder="Digite alguma informação importante sobre este lead..."
            value={form.notes ?? ""}
            onChange={(event) => update("notes", event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={onCancel}
          >
            Cancelar
          </Button>

          <Button type="submit" disabled={loading}>
            {loading
              ? "Salvando..."
              : lead
                ? "Salvar alterações"
                : "Criar Lead"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
