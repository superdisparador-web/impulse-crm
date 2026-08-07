import { CalendarClock, Clock3, Zap } from "lucide-react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import CampaignSurface from "@/components/ui/crm/CampaignSurface";

export default function ScheduleStep({
  mode,
  onMode,
  scheduledAt,
  onScheduledAt,
  timezone,
  onTimezone,
}: {
  mode: "NOW" | "LATER";
  onMode: (value: "NOW" | "LATER") => void;
  scheduledAt: string;
  onScheduledAt: (value: string) => void;
  timezone: string;
  onTimezone: (value: string) => void;
}) {
  const choices = [
    {
      value: "NOW" as const,
      title: "Enviar agora",
      description: "Prepara os destinatários e alimenta a fila oficial.",
      icon: Zap,
    },
    {
      value: "LATER" as const,
      title: "Agendar envio",
      description: "Defina uma data, horário e fuso para iniciar.",
      icon: CalendarClock,
    },
  ];
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700">
          <Clock3 size={20} />
        </span>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950">
            Quando deseja enviar?
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Escolha o momento de início. Nada será enviado antes da confirmação
            final.
          </p>
        </div>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {choices.map((choice) => {
          const Icon = choice.icon;
          const selected = mode === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onMode(choice.value)}
              className={`group flex min-h-32 items-start gap-4 rounded-2xl border p-5 text-left outline-none transition-all duration-200 focus-visible:ring-4 focus-visible:ring-blue-100 ${selected ? "border-blue-500 bg-blue-50/80 shadow-[0_12px_30px_-20px_rgba(37,99,235,.5)]" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"}`}
            >
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors ${selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"}`}
              >
                <Icon size={19} />
              </span>
              <span>
                <strong className="block text-base text-slate-900">
                  {choice.title}
                </strong>
                <span className="mt-1 block text-sm leading-5 text-slate-600">
                  {choice.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {mode === "LATER" && (
        <CampaignSurface className="grid animate-[fadeIn_.2s_ease-out] gap-5 sm:grid-cols-2">
          <Input
            label="Data e horário"
            type="datetime-local"
            min={new Date().toISOString().slice(0, 16)}
            value={scheduledAt}
            onChange={(event) => onScheduledAt(event.target.value)}
          />
          <Select
            label="Fuso horário"
            value={timezone}
            onChange={(event) => onTimezone(event.target.value)}
            options={[
              { value: "America/Sao_Paulo", label: "Brasília (UTC-3)" },
              { value: "UTC", label: "UTC" },
            ]}
          />
        </CampaignSurface>
      )}
    </div>
  );
}
