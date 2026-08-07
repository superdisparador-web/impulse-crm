import { AlertTriangle, Check, LockKeyhole } from "lucide-react";
export default function WizardProgress({
  steps,
  current,
  issues = [],
  onStep,
}: {
  steps: string[];
  current: number;
  issues?: { step: number; severity: string }[];
  onStep?: (step: number) => void;
}) {
  return (
    <nav aria-label="Etapas da campanha" className="overflow-x-auto pb-2">
      <ol className="flex min-w-max gap-2 lg:min-w-0">
        {steps.map((label, index) => {
          const number = index + 1,
            error = issues.some(
              (x) => x.step === number && x.severity === "ERROR",
            ),
            warning = !error && issues.some((x) => x.step === number),
            done = number < current,
            locked = number > current;
          return (
            <li key={label} className="min-w-44 flex-1">
              <button
                type="button"
                disabled={locked}
                title={
                  locked
                    ? "Conclua as etapas anteriores para continuar."
                    : undefined
                }
                onClick={() => onStep?.(number)}
                aria-current={current === number ? "step" : undefined}
                className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border p-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${current === number ? "border-blue-600 bg-blue-600 text-white shadow-md" : error ? "border-red-200 bg-red-50 text-red-800" : warning ? "border-amber-200 bg-amber-50 text-amber-800" : done ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-500"}`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${current === number ? "bg-white/20" : done ? "bg-emerald-100" : "bg-white"}`}
                >
                  {error ? (
                    <AlertTriangle size={16} />
                  ) : done ? (
                    <Check size={17} />
                  ) : locked ? (
                    <LockKeyhole size={14} />
                  ) : (
                    number
                  )}
                </span>
                <span>
                  <strong className="block">{label}</strong>
                  <small className="opacity-75">
                    {error
                      ? "Requer correção"
                      : warning
                        ? "Há um alerta"
                        : done
                          ? "Concluída"
                          : current === number
                            ? "Em andamento"
                            : "Bloqueada"}
                  </small>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
