"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { campaignsService } from "@/services/campaigns.service";
import { whatsappService } from "@/services/whatsapp.service";
import { Campaign } from "@/types/campaign";
import { WhatsappAccount, WhatsappTemplate } from "@/types/whatsapp";

export default function EditCampaignPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [accounts, setAccounts] = useState<WhatsappAccount[]>([]);
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const [campaignData, accountData, templateData] = await Promise.all([
        campaignsService.getCampaignById(id),
        whatsappService.getAccounts(),
        whatsappService.getTemplates(),
      ]);

      if (!active) return;

      setCampaign(campaignData);
      setAccounts(accountData);
      setTemplates(templateData);
    }

    void load().catch((err) => {
      if (!active) return;
      setError(err instanceof Error ? err.message : "Erro ao carregar edição.");
    });

    return () => {
      active = false;
    };
  }, [id]);

  async function save() {
    if (!campaign || saving) return;

    setSaving(true);
    setError("");

    try {
      await campaignsService.updateCampaign(id, {
        name: campaign.name,
        description: campaign.description ?? "",
        whatsappAccountId: campaign.whatsappAccountId ?? "",
        whatsappTemplateId: campaign.whatsappTemplateId ?? "",
        scheduledAt: campaign.scheduledAt ?? undefined,
      });
      router.push(`/campaigns/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (!campaign) return <main>{error || "Carregando..."}</main>;

  const locked = ["COMPLETED", "CANCELED"].includes(campaign.status);

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">Editar campanha</h1>

      {locked && (
        <div className="rounded border border-yellow-700 bg-yellow-950/40 p-3">
          Campanhas concluídas ou canceladas não podem ser editadas livremente.
        </div>
      )}

      {error && (
        <div className="rounded border border-red-800 bg-red-950/50 p-3 text-red-200">
          {error}
        </div>
      )}

      <input
        disabled={locked}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
        value={campaign.name}
        onChange={(event) =>
          setCampaign({ ...campaign, name: event.target.value })
        }
      />
      <textarea
        disabled={locked}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
        value={campaign.description ?? ""}
        onChange={(event) =>
          setCampaign({ ...campaign, description: event.target.value })
        }
      />
      <select
        disabled={locked}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
        value={campaign.whatsappAccountId ?? ""}
        onChange={(event) =>
          setCampaign({ ...campaign, whatsappAccountId: event.target.value })
        }
      >
        <option value="">Conta WhatsApp</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>
      <select
        disabled={locked}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
        value={campaign.whatsappTemplateId ?? ""}
        onChange={(event) =>
          setCampaign({ ...campaign, whatsappTemplateId: event.target.value })
        }
      >
        <option value="">Template</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name} ({template.category}/{template.language})
          </option>
        ))}
      </select>
      <button
        disabled={locked || saving}
        className="rounded bg-blue-600 px-4 py-2 disabled:opacity-50"
        onClick={() => void save()}
      >
        {saving ? "Salvando..." : "Salvar alterações"}
      </button>
    </main>
  );
}
