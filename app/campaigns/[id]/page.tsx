"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { campaignsService } from "@/services/campaigns.service";
import { Campaign } from "@/types/campaign";

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await campaignsService.getCampaignById(id);

        if (!active) return;

        setError("");
        setCampaign(data);
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error ? err.message : "Erro ao carregar campanha.",
        );
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [id]);

  async function cancelCampaign() {
    if (actionLoading) return;

    setActionLoading(true);
    setError("");

    try {
      setCampaign(await campaignsService.cancelCampaign(id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao cancelar campanha.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  if (error && !campaign) {
    return (
      <main>
        <div className="rounded border border-red-800 bg-red-950/50 p-3 text-red-200">
          {error}
        </div>
      </main>
    );
  }

  if (!campaign) return <main>Carregando...</main>;

  const metrics = [
    ["Contatos", campaign.totalContacts],
    ["Fila", campaign.totalQueued],
    ["Enviadas", campaign.totalSent],
    ["Entregues", campaign.totalDelivered],
    ["Lidas", campaign.totalRead],
    ["Falhas", campaign.totalFailed],
    ["Cliques", campaign.totalClicked],
  ] as const;

  return (
    <main className="space-y-6">
      <div className="flex justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">{campaign.name}</h1>
          <p className="text-slate-400">Status: {campaign.status}</p>
        </div>
        <div className="flex gap-2">
          <Link
            className="rounded bg-slate-800 px-4 py-2"
            href={`/campaigns/${id}/edit`}
          >
            Editar
          </Link>
          <button
            className="rounded bg-red-900 px-4 py-2 disabled:opacity-50"
            disabled={actionLoading || campaign.status === "CANCELED"}
            onClick={() => void cancelCampaign()}
          >
            Cancelar
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-800 bg-red-950/50 p-3 text-red-200">
          {error}
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-slate-900 p-4">
          <h2 className="font-semibold">Informações gerais</h2>
          <p>{campaign.description || "Sem descrição"}</p>
          <p>Criada por: {campaign.createdBy?.name}</p>
          <p>Criada em: {new Date(campaign.createdAt).toLocaleString()}</p>
          <p>
            Agendada:{" "}
            {campaign.scheduledAt
              ? new Date(campaign.scheduledAt).toLocaleString()
              : "-"}
          </p>
        </div>
        <div className="rounded-xl bg-slate-900 p-4">
          <h2 className="font-semibold">Conta</h2>
          <p>{campaign.whatsappAccount?.name ?? "-"}</p>
          <p>{campaign.whatsappAccount?.phoneNumber ?? ""}</p>
        </div>
        <div className="rounded-xl bg-slate-900 p-4">
          <h2 className="font-semibold">Template</h2>
          <p>{campaign.whatsappTemplate?.name ?? "-"}</p>
          <p>
            {campaign.whatsappTemplate?.category} {campaign.whatsappTemplate?.language}
          </p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-7">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-slate-900 p-4">
            <p className="text-slate-400">{label}</p>
            <strong className="text-2xl">{value}</strong>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-slate-800">
        <h2 className="p-4 text-xl font-semibold">Destinatários e erros</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {campaign.recipients?.length ? (
                campaign.recipients.map((recipient) => (
                  <tr key={recipient.id} className="border-t border-slate-800">
                    <td className="p-3">{recipient.name}</td>
                    <td>{recipient.phone}</td>
                    <td>{recipient.status}</td>
                    <td>{recipient.errorMessage ?? "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-4 text-slate-400">Nenhum destinatário.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
