"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { campaignsService } from "@/services/campaigns.service";
import { whatsappService } from "@/services/whatsapp.service";
import { Campaign, CampaignFilters, CampaignStatus } from "@/types/campaign";
import { WhatsappAccount, WhatsappTemplate } from "@/types/whatsapp";

const statuses: CampaignStatus[] = [
  "DRAFT",
  "SCHEDULED",
  "PROCESSING",
  "PAUSED",
  "COMPLETED",
  "CANCELED",
  "FAILED",
];

export default function CampaignsPage() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [filters, setFilters] = useState<CampaignFilters>({
    page: 1,
    limit: 10,
  });
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [accounts, setAccounts] = useState<WhatsappAccount[]>([]);
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [data, accountData, templateData] = await Promise.all([
        campaignsService.getCampaigns(filters),
        whatsappService.getAccounts(),
        whatsappService.getTemplates(),
      ]);

      setItems(data.items);
      setMeta(data.meta);
      setAccounts(accountData);
      setTemplates(templateData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar campanhas.",
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [load]);

  async function runAction(
    campaignId: string,
    text: string,
    fn: () => Promise<unknown>,
  ) {
    if (actionLoading) return;

    setActionLoading(campaignId);
    setError("");

    try {
      await fn();
      setMessage(text);
      await load();
      window.setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro na ação.");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Campanhas</h1>
          <p className="mt-2 text-slate-400">
            Crie, prepare e agende campanhas integradas ao WhatsApp sem disparos
            reais nesta etapa.
          </p>
        </div>
        <Link
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700"
          href="/campaigns/new"
        >
          Nova Campanha
        </Link>
      </div>

      {message && (
        <div className="rounded-lg border border-green-800 bg-green-950/50 p-3 text-green-200">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        <input
          className="rounded-xl border border-slate-700 bg-slate-900 p-3"
          placeholder="Buscar por nome"
          value={filters.search ?? ""}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              page: 1,
              search: event.target.value,
            }))
          }
        />
        <select
          className="rounded-xl border border-slate-700 bg-slate-900 p-3"
          value={filters.status ?? ""}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              page: 1,
              status: event.target.value as CampaignStatus | "",
            }))
          }
        >
          <option value="">Todos os status</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-slate-700 bg-slate-900 p-3"
          value={filters.whatsappAccountId ?? ""}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              page: 1,
              whatsappAccountId: event.target.value,
            }))
          }
        >
          <option value="">Todas as contas</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-slate-700 bg-slate-900 p-3"
          value={filters.whatsappTemplateId ?? ""}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              page: 1,
              whatsappTemplateId: event.target.value,
            }))
          }
        >
          <option value="">Todos os templates</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} ({template.language})
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-300">
            <tr>
              <th className="p-3 text-left">Nome</th>
              <th>Status</th>
              <th>Conta WhatsApp</th>
              <th>Template</th>
              <th>Destinatários</th>
              <th>Criada em</th>
              <th>Agendamento</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-6" colSpan={8}>
                  Carregando...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="p-6 text-slate-400" colSpan={8}>
                  Nenhuma campanha encontrada.
                </td>
              </tr>
            ) : (
              items.map((campaign) => (
                <tr key={campaign.id} className="border-t border-slate-800">
                  <td className="p-3 font-medium">{campaign.name}</td>
                  <td>
                    <span className="rounded-full bg-slate-800 px-2 py-1">
                      {campaign.status}
                    </span>
                  </td>
                  <td>{campaign.whatsappAccount?.name ?? "-"}</td>
                  <td>{campaign.whatsappTemplate?.name ?? "-"}</td>
                  <td>{campaign._count?.recipients ?? campaign.totalContacts}</td>
                  <td>{new Date(campaign.createdAt).toLocaleString()}</td>
                  <td>
                    {campaign.scheduledAt
                      ? new Date(campaign.scheduledAt).toLocaleString()
                      : "-"}
                  </td>
                  <td className="flex flex-wrap gap-2 p-3">
                    <Link
                      className="text-blue-300"
                      href={`/campaigns/${campaign.id}`}
                    >
                      Visualizar
                    </Link>
                    <Link
                      className="text-slate-300"
                      href={`/campaigns/${campaign.id}/edit`}
                    >
                      Editar
                    </Link>
                    <button
                      disabled={Boolean(actionLoading)}
                      onClick={() =>
                        void runAction(
                          campaign.id,
                          "Campanha duplicada.",
                          () => campaignsService.duplicateCampaign(campaign.id),
                        )
                      }
                    >
                      Duplicar
                    </button>
                    <button
                      disabled={Boolean(actionLoading)}
                      onClick={() =>
                        void runAction(
                          campaign.id,
                          "Campanha cancelada.",
                          () => campaignsService.cancelCampaign(campaign.id),
                        )
                      }
                    >
                      Cancelar
                    </button>
                    <button
                      className="text-red-300"
                      disabled={Boolean(actionLoading)}
                      onClick={() => {
                        if (!window.confirm(`Excluir ${campaign.name}?`)) return;
                        void runAction(
                          campaign.id,
                          "Campanha excluída.",
                          () => campaignsService.deleteCampaign(campaign.id),
                        );
                      }}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between text-sm text-slate-400">
        <span>
          {meta.total} campanha(s) • página {meta.page} de{
            " "
          }{meta.totalPages || 1}
        </span>
        <div className="flex gap-2">
          <button
            disabled={meta.page <= 1}
            className="rounded bg-slate-800 px-3 py-2 disabled:opacity-50"
            onClick={() =>
              setFilters((current) => ({
                ...current,
                page: (current.page ?? 1) - 1,
              }))
            }
          >
            Anterior
          </button>
          <button
            disabled={meta.page >= meta.totalPages}
            className="rounded bg-slate-800 px-3 py-2 disabled:opacity-50"
            onClick={() =>
              setFilters((current) => ({
                ...current,
                page: (current.page ?? 1) + 1,
              }))
            }
          >
            Próxima
          </button>
        </div>
      </div>
    </main>
  );
}
