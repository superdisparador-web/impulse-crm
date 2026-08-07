"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useToast } from "@/components/ui/crm";
import { campaignsService } from "@/services/campaigns.service";
import {
  Campaign,
  CampaignFilters,
  CampaignStatus,
  CampaignType,
} from "@/types/campaign";

const statuses: CampaignStatus[] = [
  "DRAFT",
  "SCHEDULED",
  "RUNNING",
  "PAUSED",
  "COMPLETED",
  "CANCELED",
];

const types: CampaignType[] = [
  "MARKETING",
  "UTILITY",
  "AUTHENTICATION",
];

const labels: Record<string, string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Agendada",
  RUNNING: "Em execução",
  PAUSED: "Pausada",
  COMPLETED: "Concluída",
  CANCELED: "Cancelada",
  MARKETING: "Marketing",
  UTILITY: "Utilidade",
  AUTHENTICATION: "Autenticação",
};

export default function CampaignsPage() {
  const toast = useToast();

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

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const data = await campaignsService.getCampaigns(filters);

      setItems(data.items);
      setMeta(data.meta);
    } catch (error) {
      toast.error(
        "Erro ao carregar campanhas",
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as campanhas.",
      );
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [load]);

  async function runAction(
    campaignId: string,
    successMessage: string,
    action: () => Promise<unknown>,
  ) {
    if (actionLoading) return;

    setActionLoading(campaignId);

    try {
      await action();
      await load();

      toast.success("Ação concluída", successMessage);
    } catch (error) {
      toast.error(
        "Não foi possível concluir",
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao executar esta ação.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || actionLoading) return;

    const campaign = deleteTarget;

    setActionLoading(campaign.id);

    try {
      await campaignsService.deleteCampaign(campaign.id);

      setDeleteTarget(null);
      await load();

      toast.success(
  "Campanha excluída",
  `A campanha "${campaign.name}" foi removida com sucesso.`,
);
    } catch (error) {
      toast.error(
        "Erro ao excluir campanha",
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a campanha.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <>
      <main className="space-y-6 text-slate-900">
        <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-7 text-white shadow-xl">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.24em] text-blue-200">
                WhatsApp Business Platform
              </p>

              <h1 className="mt-2 text-4xl font-bold">Campanhas</h1>

              <p className="mt-2 max-w-2xl text-blue-100">
                Crie, agende e acompanhe disparos oficiais com segurança e
                métricas em tempo real.
              </p>
            </div>

            <Link
              className="rounded-xl bg-white px-5 py-3 font-bold text-blue-700 shadow-lg transition hover:-translate-y-0.5"
              href="/campaigns/new"
            >
              + Nova Campanha
            </Link>
          </div>
        </header>

        <div className="grid gap-3 md:grid-cols-4">
          <input
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="Buscar por nome ou descrição"
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
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                {labels[status]}
              </option>
            ))}
          </select>

          <select
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            value={filters.campaignType ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                campaignType: event.target.value as CampaignType | "",
              }))
            }
          >
            <option value="">Todos os tipos</option>

            {types.map((type) => (
              <option key={type} value={type}>
                {labels[type]}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <input
              type="checkbox"
              checked={Boolean(filters.archived)}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  page: 1,
                  archived: event.target.checked,
                }))
              }
            />

            Arquivadas
          </label>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-3 text-left">Nome</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Tipo</th>
                <th className="p-3 text-left">Filtros</th>
                <th className="p-3 text-left">Criada em</th>
                <th className="p-3 text-left">Agendamento</th>
                <th className="p-3 text-left">Ações</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="p-6" colSpan={7}>
                    <div
                      className="h-12 animate-pulse rounded-xl bg-slate-100"
                      aria-label="Carregando campanhas"
                    />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="p-6 text-slate-400" colSpan={7}>
                    <div className="py-8 text-center">
                      <strong className="block text-slate-700">
                        Nenhuma campanha encontrada
                      </strong>

                      <span>
                        Ajuste os filtros ou crie sua primeira campanha.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((campaign) => {
                  const busy = actionLoading === campaign.id;

                  return (
                    <tr
                      key={campaign.id}
                      className="border-t border-slate-100 transition hover:bg-slate-50/70"
                    >
                      <td className="p-3 font-medium text-slate-900">
                        {campaign.name}
                      </td>

                      <td className="p-3">
                        <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-white">
                          {labels[campaign.status] ?? campaign.status}
                        </span>
                      </td>

                      <td className="p-3">
                        {labels[campaign.campaignType] ??
                          campaign.campaignType}
                      </td>

                      <td className="p-3">
                        {campaign._count?.filters ??
                          campaign.filters?.length ??
                          0}
                      </td>

                      <td className="p-3">
                        {new Date(campaign.createdAt).toLocaleString("pt-BR")}
                      </td>

                      <td className="p-3">
                        {campaign.scheduledAt
                          ? new Date(campaign.scheduledAt).toLocaleString(
                              "pt-BR",
                            )
                          : "-"}
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <Link
                            className="font-semibold text-blue-600 transition hover:text-blue-800"
                            href={`/campaigns/${campaign.id}`}
                          >
                            Visualizar
                          </Link>

                          <button
                            type="button"
                            disabled={Boolean(actionLoading)}
                            className="font-medium text-slate-600 transition hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() =>
                              void runAction(
                                campaign.id,
                                campaign.archivedAt
                                  ? `A campanha "${campaign.name}" foi restaurada do arquivo.`
                                  : `A campanha "${campaign.name}" foi arquivada.`,
                                () =>
                                  campaignsService.archiveCampaign(
                                    campaign.id,
                                    !campaign.archivedAt,
                                  ),
                              )
                            }
                          >
                            {busy
                              ? "Processando..."
                              : campaign.archivedAt
                                ? "Desarquivar"
                                : "Arquivar"}
                          </button>

                          <button
                            type="button"
                            disabled={Boolean(actionLoading)}
                            className="font-medium text-amber-700 transition hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() =>
                              void runAction(
                                campaign.id,
                                `A campanha "${campaign.name}" foi cancelada.`,
                                () =>
                                  campaignsService.cancelCampaign(campaign.id),
                              )
                            }
                          >
                            Cancelar
                          </button>

                          <button
                            type="button"
                            className="font-semibold text-red-600 transition hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={Boolean(actionLoading)}
                            onClick={() => setDeleteTarget(campaign)}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span>
            {meta.total} campanha(s) • página {meta.page} de{" "}
            {meta.totalPages || 1}
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={meta.page <= 1}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
              type="button"
              disabled={meta.page >= meta.totalPages}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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

      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-campaign-title"
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !actionLoading) {
              setDeleteTarget(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-100 text-red-700">
              <span className="text-xl" aria-hidden="true">
                🗑️
              </span>
            </div>

            <h2
              id="delete-campaign-title"
              className="mt-5 text-xl font-bold text-slate-950"
            >
              Excluir campanha
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Tem certeza que deseja excluir a campanha{" "}
              <strong className="text-slate-900">
                “{deleteTarget.name}”
              </strong>
              ?
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
  A campanha será removida da lista de campanhas ativas.
</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={Boolean(actionLoading)}
                className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={Boolean(actionLoading)}
                className="min-h-11 rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => void confirmDelete()}
              >
                {actionLoading ? "Excluindo..." : "Excluir campanha"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}