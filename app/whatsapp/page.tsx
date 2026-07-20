"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Settings, Plus } from "lucide-react";
import { whatsappService } from "@/services/whatsapp.service";
import { WhatsappAccount } from "@/types/whatsapp";

function formatDate(value?: string | null) {
  if (!value) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default function WhatsappPage() {
  const [accounts, setAccounts] = useState<WhatsappAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setAccounts(await whatsappService.getAccounts());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar contas do WhatsApp.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  async function syncTemplates() {
    const account = accounts[0];
    if (!account) {
      setError("Cadastre uma conta antes de sincronizar templates.");
      return;
    }
    const result = await whatsappService.syncTemplates({ accountId: account.id, organizationId: account.organizationId });
    setMessage(result.message || "Sincronização preparada.");
    await load();
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">WhatsApp</h1>
          <p className="mt-2 text-slate-400">Infraestrutura da API Oficial da Meta para contas, webhooks e templates.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700"><Plus size={18} /> Nova Conta</button>
          <button onClick={syncTemplates} className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-3 font-semibold hover:bg-slate-700"><RefreshCw size={18} /> Sincronizar Templates</button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-5 py-3 font-semibold hover:bg-slate-800"><Settings size={18} /> Configurar Webhook</button>
        </div>
      </div>
      {message && <div className="rounded-lg border border-green-800 bg-green-950/50 p-3 text-green-200">{message}</div>}
      {error && <div className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-red-200">{error}</div>}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 p-5"><h2 className="text-xl font-semibold">Contas conectadas</h2><p className="text-sm text-slate-400">Lista de números preparados para integração com a Meta.</p></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-400"><tr className="border-b border-slate-800"><th className="p-4">Nome</th><th className="p-4">Número</th><th className="p-4">Status</th><th className="p-4">Última sincronização</th><th className="p-4">Organização</th></tr></thead><tbody>
          {loading ? <tr><td className="p-4 text-slate-400" colSpan={5}>Carregando...</td></tr> : accounts.length === 0 ? <tr><td className="p-4 text-slate-400" colSpan={5}>Nenhuma conta conectada.</td></tr> : accounts.map((account) => <tr key={account.id} className="border-b border-slate-800 last:border-0"><td className="p-4 font-medium">{account.name}</td><td className="p-4">{account.phoneNumber}</td><td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${account.status === "CONNECTED" ? "bg-green-900 text-green-200" : "bg-slate-800 text-slate-300"}`}>{account.status === "CONNECTED" ? "Conectado" : "Desconectado"}</span></td><td className="p-4">{formatDate(account.lastSyncAt)}</td><td className="p-4">{account.organization?.name ?? account.organizationId}</td></tr>)}
        </tbody></table></div>
      </section>
    </main>
  );
}
