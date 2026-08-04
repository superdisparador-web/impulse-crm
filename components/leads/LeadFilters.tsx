import { CalendarDays, RotateCcw, SlidersHorizontal } from "lucide-react";

import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";

import {
  LeadListParams,
  LeadSource,
  LeadStatus,
  LeadTemperature,
} from "@/types/lead";
import { User } from "@/types/user";

import {
  leadSourceLabels,
  leadStatusLabels,
  leadTemperatureLabels,
} from "./lead-labels";

const statuses = Object.keys(leadStatusLabels) as LeadStatus[];
const temperatures = Object.keys(
  leadTemperatureLabels,
) as LeadTemperature[];
const sources = Object.keys(leadSourceLabels) as LeadSource[];

type Props = {
  filters: LeadListParams;
  users: User[];
  onChange: (filters: LeadListParams) => void;
};

export default function LeadFilters({
  filters,
  users,
  onChange,
}: Props) {
  function setFilter(
    key: keyof LeadListParams,
    value: string | boolean,
  ) {
    onChange({
      ...filters,
      page: 1,
      [key]: value,
    });
  }

  function clearFilters() {
    onChange({
      page: 1,
      limit: filters.limit ?? 10,
      order: "desc",
      search: filters.search ?? "",
    });
  }

  const hasActiveFilters = Boolean(
    filters.status ||
      filters.temperature ||
      filters.source ||
      filters.assignedUserId ||
      filters.createdFrom ||
      filters.archived,
  );

  return (
    <section
      aria-label="Filtros de leads"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <SlidersHorizontal size={19} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Filtros
            </h2>

            <p className="text-sm text-slate-500">
              Refine a lista de leads
            </p>
          </div>
        </div>

        {hasActiveFilters && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Filtros ativos
          </span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Select
          label="Status"
          value={filters.status ?? ""}
          onChange={(event) =>
            setFilter("status", event.target.value)
          }
          options={[
            { label: "Todos os status", value: "" },
            ...statuses.map((status) => ({
              label: leadStatusLabels[status],
              value: status,
            })),
          ]}
        />

        <Select
          label="Temperatura"
          value={filters.temperature ?? ""}
          onChange={(event) =>
            setFilter("temperature", event.target.value)
          }
          options={[
            { label: "Todas as temperaturas", value: "" },
            ...temperatures.map((temperature) => ({
              label: leadTemperatureLabels[temperature],
              value: temperature,
            })),
          ]}
        />

        <Select
          label="Origem"
          value={filters.source ?? ""}
          onChange={(event) =>
            setFilter("source", event.target.value)
          }
          options={[
            { label: "Todas as origens", value: "" },
            ...sources.map((source) => ({
              label: leadSourceLabels[source],
              value: source,
            })),
          ]}
        />

        <Select
          label="Responsável"
          value={filters.assignedUserId ?? ""}
          onChange={(event) =>
            setFilter("assignedUserId", event.target.value)
          }
          options={[
            { label: "Todos os responsáveis", value: "" },
            ...users.map((user) => ({
              label: user.name,
              value: user.id,
            })),
          ]}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Cadastro a partir de
          </span>

          <div className="relative">
            <CalendarDays
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="lead-created-from"
              type="date"
              value={filters.createdFrom ?? ""}
              onChange={(event) =>
                setFilter("createdFrom", event.target.value)
              }
              className="
                min-h-11
                w-full
                rounded-xl
                border
                border-slate-200
                bg-white
                py-2.5
                pl-10
                pr-4
                text-sm
                text-slate-700
                outline-none
                transition
                hover:border-slate-300
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-500/10
              "
            />
          </div>
        </label>

        <Select
          label="Exibição"
          value={filters.archived === true ? "true" : "false"}
          onChange={(event) =>
            setFilter(
              "archived",
              event.target.value === "true",
            )
          }
          options={[
            { label: "Leads ativos", value: "false" },
            { label: "Leads arquivados", value: "true" },
          ]}
        />

        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="min-h-11 whitespace-nowrap"
          >
            <RotateCcw size={16} />
            Limpar filtros
          </Button>
        </div>
      </div>
    </section>
  );
}
