"use client";

import {
  ArrowRight,
  Check,
  Clock3,
  MessageCircle,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import Button from "@/components/ui/Button";

interface WhatsAppEmptyStateProps {
  canManage: boolean;
  isGlobalAdmin: boolean;
  connecting: boolean;
  onConnect: () => void;
  onManualConnect: () => void;
}

const benefits = [
  "Conexão segura pelo Facebook",
  "Número e conta identificados automaticamente",
  "Templates sincronizados após a conexão",
  "Sem precisar copiar tokens ou códigos",
];

const steps = [
  {
    number: "1",
    title: "Entre no Facebook",
    description: "Use o acesso da empresa responsável pela conta do WhatsApp.",
  },
  {
    number: "2",
    title: "Escolha sua empresa",
    description: "Selecione o Business Manager e o número que deseja conectar.",
  },
  {
    number: "3",
    title: "Conclua a conexão",
    description: "O Impulse CRM salva os dados e inicia a sincronização.",
  },
];

export function WhatsAppEmptyState({
  canManage,
  isGlobalAdmin,
  connecting,
  onConnect,
  onManualConnect,
}: WhatsAppEmptyStateProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
            <ShieldCheck size={15} />
            Integração oficial da Meta
          </div>

          <div className="mt-6 flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <MessageCircle size={28} />
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                Conecte seu WhatsApp Oficial
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Faça a conexão com sua conta empresarial do Facebook. O Impulse
                CRM identifica o número e prepara a integração automaticamente.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check size={14} strokeWidth={3} />
                </span>

                <span className="text-sm font-medium leading-5 text-slate-700">
                  {benefit}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            {canManage && (
              <Button
                onClick={onConnect}
                loading={connecting}
                className="min-h-11"
              >
                <ArrowRight size={17} />
                Conectar com Facebook
              </Button>
            )}

            {isGlobalAdmin && (
              <button
                type="button"
                onClick={onManualConnect}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <Settings2 size={16} />
                Configuração avançada
              </button>
            )}
          </div>

          <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
            <Clock3 size={14} />
            Tempo estimado: menos de 2 minutos
          </div>
        </div>

        <aside className="border-t border-slate-200 bg-slate-950 p-6 text-white sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
            Como funciona
          </p>

          <ol className="mt-6 space-y-5">
            {steps.map((step) => (
              <li key={step.number} className="flex gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-sm font-bold text-blue-200">
                  {step.number}
                </span>

                <div>
                  <strong className="block text-sm">{step.title}</strong>

                  <p className="mt-1 text-sm leading-5 text-slate-400">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">
              Seus dados continuam protegidos
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              A autenticação acontece no ambiente oficial da Meta. O usuário não
              precisa informar sua senha do Facebook ao Impulse CRM.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
