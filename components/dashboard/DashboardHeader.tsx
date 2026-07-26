interface DashboardHeaderProps {
  title?: string;
  description?: string;
}

export default function DashboardHeader({
  title = "Dashboard",
  description = "Visão consolidada dos leads, campanhas e conexões WhatsApp da sua organização com dados reais do CRM.",
}: DashboardHeaderProps) {
  return (
    <header>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        {title}
      </h1>

      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
        {description}
      </p>
    </header>
  );
}
