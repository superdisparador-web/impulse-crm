"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { campaignsService } from "@/services/campaigns.service";
import { leadService } from "@/services/lead.service";
import { whatsappService } from "@/services/whatsapp.service";
import { Lead } from "@/types/lead";
import { WhatsappAccount, WhatsappTemplate } from "@/types/whatsapp";

const selectableTemplateStatuses = new Set(["APPROVED", "SYNCED"]);

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [accounts, setAccounts] = useState<WhatsappAccount[]>([]);
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    whatsappAccountId: "",
    whatsappTemplateId: "",
    scheduledAt: "",
  });

  useEffect(() => {
    let active = true;

    async function loadWhatsappOptions() {
      const [accountData, templateData] = await Promise.all([
        whatsappService.getAccounts(),
        whatsappService.getTemplates(),
      ]);

      if (!active) return;

      setAccounts(
        accountData.filter((account) => account.status === "CONNECTED"),
      );
      setTemplates(
        templateData.filter((template) =>
          selectableTemplateStatuses.has(template.status),
        ),
      );
    }

    void loadWhatsappOptions().catch((err) => {
      if (!active) return;
      setError(err instanceof Error ? err.message : "Erro ao carregar dados.");
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const timeoutId = window.setTimeout(() => {
      void leadService
        .getAll({ limit: 100, search })
        .then((leadData) => {
          if (!active) return;
          setLeads(leadData.items);
        })
        .catch((err) => {
          if (!active) return;
          setError(
            err instanceof Error ? err.message : "Erro ao carregar leads.",
          );
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === form.whatsappTemplateId),
    [form.whatsappTemplateId, templates],
  );

  async function save(schedule = false) {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const campaign = await campaignsService.createCampaign({
        ...form,
        scheduledAt: undefined,
      });

      if (selected.length) {
        await campaignsService.addRecipients(campaign.id, { leadIds: selected });
      }

      if (schedule && form.scheduledAt) {
        await campaignsService.scheduleCampaign(
          campaign.id,
          new Date(form.scheduledAt).toISOString(),
        );
      }

      router.push(`/campaigns/${campaign.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao salvar campanha.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">Nova Campanha</h1>
      <p className="text-slate-400">
        Etapa {step} de 5 — envio real ainda não está ativo.
      </p>

      {error && (
        <div className="rounded border border-red-800 bg-red-950/50 p-3 text-red-200">
          {error}
        </div>
      )}

      {step === 1 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Informações</h2>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
            placeholder="Nome"
            value={form.name}
            onChange={(event) =>
              setForm({ ...form, name: event.target.value })
            }
          />
          <textarea
            className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
            placeholder="Descrição"
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">WhatsApp</h2>
          <select
            className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
            value={form.whatsappAccountId}
            onChange={(event) =>
              setForm({ ...form, whatsappAccountId: event.target.value })
            }
          >
            <option value="">Selecione uma conta conectada</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} - {account.phoneNumber}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
            value={form.whatsappTemplateId}
            onChange={(event) =>
              setForm({ ...form, whatsappTemplateId: event.target.value })
            }
          >
            <option value="">Selecione um template sincronizado</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          {selectedTemplate && (
            <p className="text-slate-300">
              Categoria: {selectedTemplate.category} • Idioma:{" "}
              {selectedTemplate.language}
            </p>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Público</h2>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
            placeholder="Buscar leads"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <p>
            {selected.length} selecionado(s). Leads sem telefone ficam
            indicados e não devem ser selecionados.
          </p>
          <div className="grid gap-2">
            {leads.map((lead) => (
              <label
                key={lead.id}
                className="flex items-center gap-3 rounded bg-slate-900 p-3"
              >
                <input
                  type="checkbox"
                  disabled={!lead.normalizedPhone}
                  checked={selected.includes(lead.id)}
                  onChange={(event) =>
                    setSelected(
                      event.target.checked
                        ? [...new Set([...selected, lead.id])]
                        : selected.filter((id) => id !== lead.id),
                    )
                  }
                />
                <span>
                  {lead.name} — {lead.phone || "sem telefone"} — {lead.status}/
                  {lead.source}/{lead.temperature}
                </span>
              </label>
            ))}
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Agendamento</h2>
          <input
            type="datetime-local"
            className="rounded-xl border border-slate-700 bg-slate-900 p-3"
            value={form.scheduledAt}
            onChange={(event) =>
              setForm({ ...form, scheduledAt: event.target.value })
            }
          />
          <div className="flex gap-3">
            <button
              className="rounded bg-slate-800 px-4 py-2 disabled:opacity-50"
              disabled={loading}
              onClick={() => void save(false)}
            >
              Salvar como rascunho
            </button>
            <button
              className="rounded bg-blue-600 px-4 py-2 disabled:opacity-50"
              disabled={loading || !form.scheduledAt}
              onClick={() => void save(true)}
            >
              Programar
            </button>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Revisão</h2>
          <p>Nome: {form.name}</p>
          <p>
            Conta: {accounts.find((item) => item.id === form.whatsappAccountId)
              ?.name ?? "-"}
          </p>
          <p>Template: {selectedTemplate?.name ?? "-"}</p>
          <p>Contatos: {selected.length}</p>
          <p>Data programada: {form.scheduledAt || "-"}</p>
          <div className="rounded border border-yellow-700 bg-yellow-950/40 p-3 text-yellow-100">
            Aviso: o envio real pela Meta ainda não está ativo nesta etapa.
          </div>
        </section>
      )}

      <div className="flex gap-2">
        <button
          className="rounded bg-slate-800 px-4 py-2 disabled:opacity-50"
          disabled={step <= 1 || loading}
          onClick={() => setStep((currentStep) => currentStep - 1)}
        >
          Voltar
        </button>
        <button
          className="rounded bg-slate-800 px-4 py-2 disabled:opacity-50"
          disabled={step >= 5 || loading}
          onClick={() => setStep((currentStep) => currentStep + 1)}
        >
          Avançar
        </button>
        <button
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 disabled:opacity-50"
          onClick={() => void save(false)}
        >
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </main>
  );
}
