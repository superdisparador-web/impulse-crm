import { Users, Flame, PhoneCall, Trophy } from "lucide-react";

import StatCard from "@/components/ui/StatCard";

type Props = {
  total: number;
  hot: number;
  contacted: number;
  converted: number;
};

export default function LeadStats({ total, hot, contacted, converted }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total de Leads"
        value={total}
        icon={<Users size={26} />}
      />

      <StatCard title="Leads Quentes" value={hot} icon={<Flame size={26} />} />

      <StatCard
        title="Em Atendimento"
        value={contacted}
        icon={<PhoneCall size={26} />}
      />

      <StatCard
        title="Convertidos"
        value={converted}
        icon={<Trophy size={26} />}
      />
    </div>
  );
}
