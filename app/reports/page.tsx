import Link from "next/link";
import { BarChart3, Download, Gauge, Users } from "lucide-react";
import { PageContainer, PageHeader, Surface } from "@/components/ui/Layout";

const reports = [
  { title: "Conversão de leads", description: "Acompanhe volume, origem e evolução dos leads.", icon: Users },
  { title: "Performance comercial", description: "Compare os indicadores da operação e dos corretores.", icon: Gauge },
  { title: "Resultados de campanhas", description: "Consulte entregas, leituras, cliques e conversões.", icon: BarChart3 },
];

export default function ReportsPage() {
  return (
    <PageContainer className="gap-8">
      <PageHeader title="Relatórios" description="Visões consolidadas para decisões comerciais mais precisas." />
      <section className="grid gap-4 md:grid-cols-3">
        {reports.map(({ title, description, icon: Icon }) => (
          <Surface key={title} className="ui-card-interactive p-5">
            <Icon className="mb-4 text-sky-400" aria-hidden="true" />
            <h2 className="font-semibold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
          </Surface>
        ))}
      </section>
      <div className="flex flex-wrap items-center gap-3 ds-radius-surface border ds-border ds-surface p-5">
        <Download className="text-slate-400" aria-hidden="true" />
        <p className="mr-auto text-sm text-slate-300">Os dados detalhados e exportações são acessados nas respectivas áreas.</p>
        <Link href="/dashboard" className="ds-radius-control ds-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-sky-400">Ver visão geral</Link>
      </div>
    </PageContainer>
  );
}
