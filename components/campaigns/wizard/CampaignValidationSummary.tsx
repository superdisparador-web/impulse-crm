import { CampaignValidationIssue } from "@/types/campaign";
export default function CampaignValidationSummary({
  issues,
}: {
  issues: CampaignValidationIssue[];
}) {
  if (!issues.length) return null;
  return (
    <section
      className="rounded-2xl border border-red-200 bg-red-50 p-4"
      role="alert"
    >
      <h3 className="font-bold text-red-800">Revise as pendências</h3>
      {Object.entries(
        issues.reduce<Record<string, CampaignValidationIssue[]>>(
          (all, item) => {
            (all[item.step] ??= []).push(item);
            return all;
          },
          {},
        ),
      ).map(([step, items]) => (
        <div key={step} className="mt-3">
          <strong className="text-sm text-red-700">Etapa {step}</strong>
          <ul className="list-disc pl-5 text-sm text-red-700">
            {items.map((item) => (
              <li key={`${item.code}:${item.field}`}>{item.message}</li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
