"use client";

import { Building2, Pencil, Power, Trash2 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Organization } from "@/types/organization";

interface OrganizationTableProps {
  organizations: Organization[];
  loading: boolean;
  error: string;
  canManage: boolean;
  onCreate: () => void;
  onEdit: (organization: Organization) => void;
  onToggleStatus: (organization: Organization) => void;
  onDelete: (organization: Organization) => void;
}

const columnCount = 7;

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function Usage({ organization }: { organization: Organization }) {
  const counts = organization._count;

  if (!counts) return <span className="text-slate-400">—</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant="blue">{formatNumber(counts.users)} usuários</Badge>
      <Badge variant="neutral">{formatNumber(counts.leads)} leads</Badge>
      <Badge variant="purple">{formatNumber(counts.campaigns)} campanhas</Badge>
    </div>
  );
}

export default function OrganizationTable({
  organizations,
  loading,
  error,
  canManage,
  onCreate,
  onEdit,
  onToggleStatus,
  onDelete,
}: OrganizationTableProps) {
  return (
    <TableContainer>
      <Table className="min-w-[1040px]">
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Uso</TableHead>
            <TableHead>Criada em</TableHead>
            <TableHead align="center">Status</TableHead>
            <TableHead align="right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={columnCount} className="p-6">
                <div className="h-32 animate-pulse rounded-xl bg-slate-100" aria-label="Carregando empresas" />
              </TableCell>
            </TableRow>
          )}

          {!loading && error && (
            <TableRow>
              <TableCell colSpan={columnCount} align="center" className="py-14 text-red-600">
                <p className="font-semibold">Não foi possível carregar as empresas</p>
                <p className="mt-1 text-sm text-red-500">{error}</p>
              </TableCell>
            </TableRow>
          )}

          {!loading && !error && organizations.length === 0 && (
            <TableRow>
              <TableCell colSpan={columnCount} className="p-5">
                <EmptyState
                  title="Nenhuma empresa encontrada"
                  description="Ajuste os filtros ou cadastre uma nova empresa para começar."
                  icon={<Building2 size={20} />}
                  action={canManage ? <Button onClick={onCreate}>Nova Empresa</Button> : undefined}
                />
              </TableCell>
            </TableRow>
          )}

          {!loading && !error && organizations.map((organization) => (
            <TableRow key={organization.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700">
                    {organization.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-900">{organization.name}</span>
                </div>
              </TableCell>
              <TableCell>{organization.document || "—"}</TableCell>
              <TableCell>
                <p className="text-slate-700">{organization.email || "—"}</p>
                {organization.phone && <p className="mt-1 text-xs text-slate-500">{organization.phone}</p>}
              </TableCell>
              <TableCell><Usage organization={organization} /></TableCell>
              <TableCell className="whitespace-nowrap">{formatDate(organization.createdAt)}</TableCell>
              <TableCell align="center">
                <Badge variant={organization.active ? "success" : "neutral"}>
                  {organization.active ? "Ativa" : "Inativa"}
                </Badge>
              </TableCell>
              <TableCell align="right">
                {canManage ? (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" aria-label={`Editar ${organization.name}`} onClick={() => onEdit(organization)}><Pencil size={16} /></Button>
                    <Button variant="ghost" size="sm" aria-label={`${organization.active ? "Inativar" : "Ativar"} ${organization.name}`} onClick={() => onToggleStatus(organization)}><Power size={16} /></Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" aria-label={`Excluir ${organization.name}`} onClick={() => onDelete(organization)}><Trash2 size={16} /></Button>
                  </div>
                ) : <span className="text-slate-400">—</span>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
