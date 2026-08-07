import {
  CampaignAudienceEstimate,
  CampaignCostEstimate,
} from "@/types/campaign";
const number = new Intl.NumberFormat("pt-BR");
export default function CampaignEstimateCard({
  estimate,
}: {
  estimate?: CampaignAudienceEstimate | CampaignCostEstimate;
}) {
  if (!estimate)
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-slate-500">
        Calcule a estimativa para visualizar duração e custo.
      </div>
    );
  const operation = "operation" in estimate ? estimate.operation : estimate;
  return (
    <section
      className="grid gap-3 rounded-2xl bg-blue-50 p-5 sm:grid-cols-2 lg:grid-cols-4"
      aria-label="Estimativa operacional"
    >
      <Metric
        label="Mensagens previstas"
        value={number.format(operation.messages)}
      />
      <Metric
        label="Velocidade"
        value={`${operation.speedPerMinute}/min · ${operation.concurrency} simultâneas`}
      />
      <Metric
        label="Duração prevista"
        value={`${operation.durationMinutes} min`}
      />
      <Metric
        label="Término previsto"
        value={new Date(operation.estimatedEndAt).toLocaleString("pt-BR")}
      />
      <Metric label="Categoria" value={operation.category} />
      <Metric
        label="Custo por mensagem"
        value={
          operation.costConfigured && operation.costPerMessage !== null
            ? operation.costPerMessage.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            : "Custo não configurado"
        }
      />
      <Metric
        label="Custo previsto"
        value={
          operation.costConfigured && operation.estimatedCost !== null
            ? operation.estimatedCost.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            : "Custo não configurado"
        }
      />
      {"totalElegivel" in estimate && (
        <>
          <Metric
            label="Contatos elegíveis"
            value={number.format(estimate.totalElegivel)}
          />
          <Metric
            label="Duplicados removidos"
            value={number.format(estimate.duplicadosRemovidos)}
          />
          <Metric
            label="Inválidos removidos"
            value={number.format(estimate.invalidosRemovidos)}
          />
        </>
      )}
    </section>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <small className="text-slate-500">{label}</small>
      <strong className="block text-slate-900">{value}</strong>
    </div>
  );
}
