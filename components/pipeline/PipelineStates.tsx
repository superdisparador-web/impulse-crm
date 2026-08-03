export function PipelineEmptyState({ title, description }: { title: string; description: string }) {
  return <div className="ds-radius-surface border border-dashed ds-border ds-surface p-8 text-center"><h2 className="text-lg font-semibold text-white">{title}</h2><p className="mt-2 text-sm text-slate-400">{description}</p></div>;
}

export function PipelineErrorState({ message }: { message: string }) {
  return <div role="alert" className="ds-radius-surface border border-red-800 bg-red-950/40 p-4 text-sm text-red-100">{message}</div>;
}
