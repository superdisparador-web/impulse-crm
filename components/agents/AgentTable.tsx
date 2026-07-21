"use client";

interface Agent {
  id: string;
  name: string;
  whatsapp: string;
  email?: string;
  mode?: string;
  weight?: number;
  maxActiveLeads?: number;
  region?: string;
  active: boolean;
}

interface AgentTableProps {
  agents: Agent[];
  loading: boolean;
  error: string;
}

export default function AgentTable({
  agents,
  loading,
  error,
}: AgentTableProps) {
  return (
    <>
      {error && (
        <div className="mb-6 rounded-lg bg-red-600 p-4 text-white">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl bg-slate-900 shadow-lg">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="p-4 text-left">Nome</th>
              <th className="p-4 text-left">WhatsApp</th>
              <th className="p-4 text-left">E-mail</th>
              <th className="p-4 text-left">Região</th>
              <th className="p-4 text-center">Peso</th>
              <th className="p-4 text-center">Leads</th>
              <th className="p-4 text-center">Status</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-slate-400"
                >
                  Carregando agentes...
                </td>
              </tr>
            )}

            {!loading && agents.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-slate-400"
                >
                  Nenhum agente encontrado.
                </td>
              </tr>
            )}

            {!loading &&
              agents.map((agent) => (
                <tr
                  key={agent.id}
                  className="border-t border-slate-800 transition hover:bg-slate-800"
                >
                  <td className="p-4 font-medium text-white">
                    {agent.name}
                  </td>

                  <td className="p-4 text-slate-300">
                    {agent.whatsapp}
                  </td>

                  <td className="p-4 text-slate-300">
                    {agent.email || "-"}
                  </td>

                  <td className="p-4 text-slate-300">
                    {agent.region || "-"}
                  </td>

                  <td className="p-4 text-center text-slate-300">
                    {agent.weight ?? 1}
                  </td>

                  <td className="p-4 text-center text-slate-300">
                    {agent.maxActiveLeads ?? 20}
                  </td>

                  <td className="p-4 text-center">
                    {agent.active ? (
                      <span className="rounded-full bg-green-600 px-3 py-1 text-sm font-semibold text-white">
                        Ativo
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white">
                        Inativo
                      </span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}