"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import LeadForm, { LeadData } from "@/components/leads/LeadForm";

type Lead = LeadData & {
  status: string;
  createdAt: string;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [selectedLead, setSelectedLead] =
    useState<LeadData | undefined>();

  const [search, setSearch] = useState("");

  async function loadLeads() {
    try {
      const data = await api<Lead[]>("/leads");

      setLeads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return leads;

    return leads.filter((lead) => {
      return (
        lead.name?.toLowerCase().includes(term) ||
        lead.phone?.toLowerCase().includes(term) ||
        lead.city?.toLowerCase().includes(term) ||
        lead.source?.toLowerCase().includes(term)
      );
    });
  }, [leads, search]);

  function statusColor(status: string) {
    switch (status?.toLowerCase()) {
      case "novo":
        return "bg-blue-600";

      case "atendimento":
        return "bg-yellow-600";

      case "proposta":
        return "bg-purple-600";

      case "vendido":
        return "bg-green-600";

      case "perdido":
        return "bg-red-600";

      default:
        return "bg-slate-600";
    }
  }

  return (
    <>
      {showForm && (
        <LeadForm
          lead={selectedLead}
          onCancel={() => {
            setSelectedLead(undefined);
            setShowForm(false);
          }}
          onSuccess={() => {
            setSelectedLead(undefined);
            setShowForm(false);
            loadLeads();
          }}
        />
      )}      <main className="space-y-6">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-4xl font-bold">
              Leads
            </h1>

            <p className="mt-2 text-slate-400">
              {filteredLeads.length} lead(s) encontrado(s)
            </p>

          </div>

          <button
            onClick={() => {
              setSelectedLead(undefined);
              setShowForm(true);
            }}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700"
          >
            + Novo Lead
          </button>

        </div>

        <input
          type="text"
          placeholder="Pesquisar por nome, telefone, cidade ou origem..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 p-4 outline-none focus:border-blue-500"
        />

        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

          <table className="w-full">

            <thead className="bg-slate-800">

              <tr>

                <th className="p-4 text-left">
                  Nome
                </th>

                <th className="p-4 text-left">
                  Telefone
                </th>

                <th className="p-4 text-left">
                  Cidade
                </th>

                <th className="p-4 text-left">
                  Origem
                </th>

                <th className="p-4 text-left">
                  Status
                </th>

                <th className="p-4 text-left">
                  Cadastro
                </th>

                <th className="p-4 text-center">
                  Ações
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan={7}
                    className="p-8 text-center text-slate-400"
                  >
                    Carregando...
                  </td>

                </tr>

              ) : filteredLeads.length === 0 ? (

                <tr>

                  <td
                    colSpan={7}
                    className="p-8 text-center text-slate-400"
                  >
                    Nenhum lead encontrado.
                  </td>

                </tr>

              ) : (

                filteredLeads.map((lead) => (

                  <tr
                    key={lead.id}
                    className="border-t border-slate-800 transition hover:bg-slate-800/40"
                  >

                    <td className="p-4 font-medium">
                      {lead.name}
                    </td>

                    <td className="p-4">
                      {lead.phone}
                    </td>

                    <td className="p-4">
                      {lead.city || "-"}
                    </td>

                    <td className="p-4">
                      {lead.source || "-"}
                    </td>

                    <td className="p-4">

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(
                          lead.status
                        )}`}
                      >
                        {lead.status}
                      </span>

                    </td>

                    <td className="p-4">
                      {new Date(
                        lead.createdAt
                      ).toLocaleDateString("pt-BR")}
                    </td>

                    <td className="p-4">

                      <div className="flex justify-center gap-2">                        <button
                          className="rounded bg-slate-700 px-3 py-2 hover:bg-slate-600"
                          title="Visualizar"
                        >
                          👁
                        </button>

                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowForm(true);
                          }}
                          className="rounded bg-blue-700 px-3 py-2 hover:bg-blue-600"
                          title="Editar"
                        >
                          ✏️
                        </button>

                        <button
                          className="rounded bg-red-700 px-3 py-2 hover:bg-red-600"
                          title="Excluir"
                        >
                          🗑
                        </button>

                        <button
                          onClick={() => {
                            window.open(
                              `https://wa.me/55${lead.phone.replace(/\D/g, "")}`,
                              "_blank"
                            );
                          }}
                          className="rounded bg-green-700 px-3 py-2 hover:bg-green-600"
                          title="WhatsApp"
                        >
                          💬
                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </main>

    </>
  );
}