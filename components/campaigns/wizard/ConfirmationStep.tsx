import {
  CalendarClock,
  CheckCircle2,
  MessageSquareText,
  Send,
  UsersRound,
} from "lucide-react";
import Button from "@/components/ui/Button";
import CampaignSurface from "@/components/ui/crm/CampaignSurface";
import StatusAlert from "@/components/ui/crm/StatusAlert";

export default function ConfirmationStep({
  completed,
  sendMode,
  scheduledAt,
  timezone,
  recipients,
  accountName,
  templateName,
  onOpenCampaign,
}: {
  completed: boolean;
  sendMode: "NOW" | "LATER";
  scheduledAt: string;
  timezone: string;
  recipients: number;
  accountName?: string;
  templateName?: string;
  onOpenCampaign: () => void;
}) {
  if (completed)
    return (
      <div className="mx-auto max-w-2xl py-8 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700 shadow-sm">
          <CheckCircle2 size={30} />
        </span>
        <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">
          Campanha confirmada
        </h2>
        <p className="mt-2 text-slate-600">
          Acompanhe fila, entregas, leituras e falhas em tempo real.
        </p>
        <Button className="mt-6" size="lg" onClick={onOpenCampaign}>
          Acompanhar execução
        </Button>
      </div>
    );
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4">
      <header className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-100 text-blue-700">
          <Send size={24} />
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
          Confirme os dados antes de continuar
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Esta etapa não dispara mensagens automaticamente. Use a ação principal
          no rodapé para confirmar conscientemente.
        </p>
      </header>
      <CampaignSurface>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="flex gap-3">
            <UsersRound className="mt-0.5 text-slate-400" size={18} />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Destinatários
              </dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {recipients.toLocaleString("pt-BR")} mensagens
              </dd>
            </div>
          </div>
          <div className="flex gap-3">
            <CalendarClock className="mt-0.5 text-slate-400" size={18} />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Início
              </dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {sendMode === "NOW"
                  ? "Imediato após confirmar"
                  : `${scheduledAt || "Data não informada"} · ${timezone}`}
              </dd>
            </div>
          </div>
          <div className="flex gap-3">
            <MessageSquareText className="mt-0.5 text-slate-400" size={18} />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Conta oficial
              </dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {accountName || "Não informada"}
              </dd>
            </div>
          </div>
          <div className="flex gap-3">
            <MessageSquareText className="mt-0.5 text-slate-400" size={18} />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Template
              </dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {templateName || "Não informado"}
              </dd>
            </div>
          </div>
        </dl>
      </CampaignSurface>
      <StatusAlert tone="warning" title="Ação com impacto real">
        Ao confirmar, a campanha será iniciada ou agendada para o público
        elegível apresentado acima.
      </StatusAlert>
    </div>
  );
}
