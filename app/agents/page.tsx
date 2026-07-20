"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";

type Agent = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  region: string;
  weight: number;
  maxActiveLeads: number;
  active: boolean;
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAgents() {
      try {
        const data = await api<Agent[]>("/agents");

        if (Array.isArray(data)) {
          setAgents(data);
        } else {
          console.error("Resposta inesperada:", data);
          setError("Resposta inválida da API.");
        }
      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar os agentes.");
      } finally {
        setLoading(false);
      }
    }

    loadAgents();
  }, []);

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Agentes</h1>
          <p className="text-slate-400 mt-2">
            Gerencie os agentes responsáveis pela distribuição dos leads.
          </p>
        </div>

        <button className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-lg font-semibold transition">
          + Novo Agente
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="text-left p-4">Nome</th>
              <th className="text-left p-4">WhatsApp</th>
              <th className="text-left p-4">Região</th>
              <th className="text-center p-4">Peso</th>
              <th className="text-center p-4">Máx. Leads</th>
              <th className="text-center p-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="p-8 text-center">
                  Carregando...
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-red-500">
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && agents.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  Nenhum agente encontrado.
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              agents.map((agent) => (
                <tr
                  key={agent.id}
                  className="border-t border-slate-800 hover:bg-slate-800/50"
                >
                  <td className="p-4 font-medium">{agent.name}</td>
                  <td className="p-4">{agent.whatsapp}</td>
                  <td className="p-4">{agent.region}</td>
                  <td className="text-center p-4">{agent.weight}</td>
                  <td className="text-center p-4">
                    {agent.maxActiveLeads}
                  </td>
                  <td className="text-center p-4">
                    {agent.active ? "🟢 Ativo" : "🔴 Inativo"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}