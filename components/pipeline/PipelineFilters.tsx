import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { PipelineFilters as Filters } from "@/types/pipeline-board";

const fields: Array<{
  key: keyof Filters;
  label: string;
  placeholder: string;
}> = [
  { key: "search", label: "Busca", placeholder: "Nome, telefone ou e-mail" },
  { key: "campaign", label: "Campanha", placeholder: "Nome da campanha" },
  {
    key: "product",
    label: "Produto",
    placeholder: "Produto ou empreendimento",
  },
  { key: "broker", label: "Corretor", placeholder: "Busque pelo nome" },
  { key: "manager", label: "Gerente", placeholder: "Busque pelo nome" },
];
const status = [
  { value: "", label: "Todos" },
  { value: "NEW", label: "Novo" },
  { value: "CONTACTED", label: "Contatado" },
  { value: "QUALIFIED", label: "Qualificado" },
  { value: "CONVERTED", label: "Convertido" },
  { value: "LOST", label: "Perdido" },
];
const temperatures = [
  { value: "", label: "Todas" },
  { value: "HOT", label: "Quente" },
  { value: "WARM", label: "Morno" },
  { value: "COLD", label: "Frio" },
  { value: "UNKNOWN", label: "Não definida" },
];

export function PipelineFilters({
  value,
  onChange,
  onApply,
  onClear,
  suggestions = {},
}: {
  value: Filters;
  suggestions?: Partial<Record<keyof Filters, string[]>>;
  onChange: (filters: Filters) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <Card aria-label="Filtros do pipeline" padding="sm">
      <div className="mb-4">
        <h2 className="font-semibold text-slate-900">Filtros</h2>
        <p className="mt-1 text-sm text-slate-500">
          Refine os leads exibidos no funil.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {fields.map((field) => (
          <div key={field.key}>
            <Input
              label={field.label}
              list={`pipeline-${field.key}`}
              value={String(value[field.key] ?? "")}
              placeholder={field.placeholder}
              onChange={(event) =>
                onChange({ ...value, [field.key]: event.target.value })
              }
            />
            <datalist id={`pipeline-${field.key}`}>
              {suggestions[field.key]?.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Select
          label="Status"
          value={value.status ?? ""}
          onChange={(event) =>
            onChange({ ...value, status: event.target.value })
          }
          options={status}
        />
        <Select
          label="Temperatura"
          value={value.temperature ?? ""}
          onChange={(event) =>
            onChange({ ...value, temperature: event.target.value })
          }
          options={temperatures}
        />
        <Input
          label="Origem"
          value={value.source ?? ""}
          onChange={(event) =>
            onChange({ ...value, source: event.target.value })
          }
        />
        <Select
          label="SLA"
          value={value.sla ?? "ALL"}
          onChange={(event) =>
            onChange({ ...value, sla: event.target.value as Filters["sla"] })
          }
          options={[
            { value: "ALL", label: "Todos" },
            { value: "ON_TIME", label: "No prazo" },
            { value: "OVERDUE", label: "Vencido" },
          ]}
        />
        <Input
          label="Data inicial"
          type="date"
          value={value.from ?? ""}
          onChange={(event) => onChange({ ...value, from: event.target.value })}
        />
        <Input
          label="Data final"
          type="date"
          value={value.to ?? ""}
          onChange={(event) => onChange({ ...value, to: event.target.value })}
        />
      </div>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClear}>
          Limpar filtros
        </Button>
        <Button onClick={onApply}>Aplicar filtros</Button>
      </div>
    </Card>
  );
}
