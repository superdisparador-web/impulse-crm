import { Lead, LeadStatus, LeadTemperature } from "@/types/lead";
import { User } from "@/types/user";
import LeadAvatar from "@/components/leads/LeadAvatar";
import ActionMenu from "@/components/ui/ActionMenu";
import Badge from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableHeaderCell,
  TableMessage,
  TableRow,
} from "@/components/ui/Table";

import {
  leadSourceLabels,
  leadStatusLabels,
  leadTemperatureLabels,
} from "./lead-labels";

type Props = {
  leads: Lead[];
  loading: boolean;
  users: User[];
  busyLeadId?: string;
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onArchive: (lead: Lead) => void;
  onAddToPipeline: (lead: Lead) => void;
  onAssign: (lead: Lead, userId: string | null) => void;
  onStatus: (lead: Lead, status: LeadStatus) => void;
  onTemperature: (lead: Lead, temperature: LeadTemperature) => void;
};

type BadgeVariant = "neutral" | "blue" | "green" | "yellow" | "red" | "purple";

const statuses = Object.keys(leadStatusLabels) as LeadStatus[];

const temperatures = Object.keys(leadTemperatureLabels) as LeadTemperature[];

const tableSelectClasses = `
  min-h-9
  min-w-[135px]
  rounded-lg
  border
  border-slate-200
  bg-white
  px-3
  py-2
  text-sm
  text-slate-700
  shadow-sm
  outline-none
  transition
  hover:border-slate-300
  focus:border-blue-500
  focus:ring-4
  focus:ring-blue-500/10
  disabled:cursor-not-allowed
  disabled:bg-slate-100
  disabled:opacity-60
`;

function show(value?: string | null) {
  return value?.trim() || "—";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

function statusVariant(status: LeadStatus): BadgeVariant {
  const value = String(status).toUpperCase();

  if (
    value.includes("WON") ||
    value.includes("CONVERTED") ||
    value.includes("QUALIFIED")
  ) {
    return "green";
  }

  if (
    value.includes("LOST") ||
    value.includes("DISQUALIFIED") ||
    value.includes("ARCHIVED")
  ) {
    return "red";
  }

  if (
    value.includes("CONTACT") ||
    value.includes("PROGRESS") ||
    value.includes("NEGOTIATION")
  ) {
    return "blue";
  }

  if (value.includes("WAIT") || value.includes("PENDING")) {
    return "yellow";
  }

  return "neutral";
}

function temperatureVariant(temperature: LeadTemperature): BadgeVariant {
  const value = String(temperature).toUpperCase();

  if (value.includes("HOT") || value.includes("QUENTE")) {
    return "red";
  }

  if (value.includes("WARM") || value.includes("MORNO")) {
    return "yellow";
  }

  if (value.includes("COLD") || value.includes("FRIO")) {
    return "blue";
  }

  return "neutral";
}

export default function LeadTable({
  leads,
  loading,
  users,
  busyLeadId,
  onView,
  onEdit,
  onArchive,
  onAddToPipeline,
  onAssign,
  onStatus,
  onTemperature,
}: Props) {
  return (
    <TableContainer>
      <Table className="min-w-[1380px]">
        <TableHeader>
          <tr>
            {[
              "Lead",
              "Contato",
              "CPF",
              "Origem",
              "Status",
              "Temperatura",
              "Responsável",
              "Cadastro",
              "Atualização",
              "Ações",
            ].map((heading) => (
              <TableHeaderCell key={heading}>{heading}</TableHeaderCell>
            ))}
          </tr>
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableMessage colSpan={10}>
              <div className="flex items-center justify-center gap-3">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
                Carregando leads...
              </div>
            </TableMessage>
          ) : leads.length === 0 ? (
            <TableMessage colSpan={10}>Nenhum lead encontrado.</TableMessage>
          ) : (
            leads.map((lead) => {
              const busy = busyLeadId === lead.id;

              return (
                <TableRow key={lead.id} className="align-middle">
                  <TableCell>
                    <LeadAvatar
                      name={lead.name}
                      email={lead.email}
                      onClick={() => onView(lead)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="min-w-[140px]">
                      <p className="font-medium text-slate-700">
                        {show(lead.phone)}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    {show(lead.document)}
                  </TableCell>

                  <TableCell>
                    <Badge variant="purple">
                      {leadSourceLabels[lead.source]}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-2">
                      <Badge variant={statusVariant(lead.status)}>
                        {leadStatusLabels[lead.status]}
                      </Badge>

                      <select
                        aria-label={`Status de ${lead.name ?? "lead"}`}
                        disabled={busy}
                        className={tableSelectClasses}
                        value={lead.status}
                        onChange={(event) =>
                          onStatus(lead, event.target.value as LeadStatus)
                        }
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {leadStatusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-2">
                      <Badge variant={temperatureVariant(lead.temperature)}>
                        {leadTemperatureLabels[lead.temperature]}
                      </Badge>

                      <select
                        aria-label={`Temperatura de ${lead.name ?? "lead"}`}
                        disabled={busy}
                        className={tableSelectClasses}
                        value={lead.temperature}
                        onChange={(event) =>
                          onTemperature(
                            lead,
                            event.target.value as LeadTemperature,
                          )
                        }
                      >
                        {temperatures.map((temperature) => (
                          <option key={temperature} value={temperature}>
                            {leadTemperatureLabels[temperature]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </TableCell>

                  <TableCell>
                    <select
                      aria-label={`Responsável de ${lead.name ?? "lead"}`}
                      disabled={busy}
                      className={`${tableSelectClasses} min-w-[170px]`}
                      value={lead.assignedUserId ?? ""}
                      onChange={(event) =>
                        onAssign(lead, event.target.value || null)
                      }
                    >
                      <option value="">Sem corretor</option>

                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-sm text-slate-500">
                    {formatDate(lead.createdAt)}
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-sm text-slate-500">
                    {formatDate(lead.updatedAt)}
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-end">
                      <ActionMenu
                        disabled={busy}
                        onView={() => onView(lead)}
                        onEdit={() => onEdit(lead)}
                        onAddToPipeline={() => onAddToPipeline(lead)}
                        onArchive={() => onArchive(lead)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
