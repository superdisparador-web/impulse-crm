"use client";

import Button from "@/components/ui/Button";
import { Organization } from "@/types/organization";

interface OrganizationTableProps {
  organizations: Organization[];
  loading: boolean;
  error: string;
  canManage: boolean;
  onEdit: (organization: Organization) => void;
  onToggleStatus: (organization: Organization) => void;
  onDelete: (organization: Organization) => void;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR");
}

function formatUsage(organization: Organization) {
  const counts = organization._count;
  if (!counts) return "—";
  return `${counts.users} usuários · ${counts.leads} leads · ${counts.campaigns} campanhas`;
}

export default function OrganizationTable({ organizations, loading, error, canManage, onEdit, onToggleStatus, onDelete }: OrganizationTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
      <table className="w-full min-w-[980px]">
        <thead className="bg-slate-800">
          <tr>
            <th className="p-4 text-left">Empresa</th>
            <th className="p-4 text-left">Documento</th>
            <th className="p-4 text-left">Contato</th>
            <th className="p-4 text-left">Uso</th>
            <th className="p-4 text-left">Criada em</th>
            <th className="p-4 text-center">Status</th>
            {canManage && <th className="p-4 text-right">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={canManage ? 7 : 6} className="p-8 text-center">Carregando empresas...</td></tr>}
          {!loading && error && <tr><td colSpan={canManage ? 7 : 6} className="p-8 text-center text-red-400">{error}</td></tr>}
          {!loading && !error && organizations.length === 0 && <tr><td colSpan={canManage ? 7 : 6} className="p-8 text-center text-slate-400">Nenhuma empresa encontrada.</td></tr>}
          {!loading && !error && organizations.map((organization) => (
            <tr key={organization.id} className="border-t border-slate-800 hover:bg-slate-800/50">
              <td className="p-4 font-medium">{organization.name}</td>
              <td className="p-4 text-slate-300">{organization.document || "—"}</td>
              <td className="p-4 text-slate-300"><div>{organization.email || "—"}</div><div className="text-sm text-slate-500">{organization.phone || "—"}</div></td>
              <td className="p-4 text-sm text-slate-300">{formatUsage(organization)}</td>
              <td className="p-4 text-slate-300">{formatDate(organization.createdAt)}</td>
              <td className="p-4 text-center">{organization.active ? "🟢 Ativa" : "🔴 Inativa"}</td>
              {canManage && <td className="p-4"><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => onEdit(organization)}>Editar</Button><Button variant="secondary" onClick={() => onToggleStatus(organization)}>{organization.active ? "Inativar" : "Ativar"}</Button><Button variant="danger" onClick={() => onDelete(organization)}>Excluir</Button></div></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
