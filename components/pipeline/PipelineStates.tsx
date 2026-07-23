export function PipelineEmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center"><h2 className="text-lg font-semibold text-white">{title}</h2><p className="mt-2 text-sm text-slate-400">{description}</p></div>;
}

export function PipelineErrorState({ message }: { message: string }) {
  return <div role="alert" className="rounded-2xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-100">{message}</div>;
}
