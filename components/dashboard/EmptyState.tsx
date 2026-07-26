import Image from "next/image";

interface EmptyStateProps {
  message: string;
}

export default function EmptyState({
  message,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-center text-sm text-slate-500 sm:p-5">
      <div className="relative mb-3 h-24 w-full max-w-40">
        <Image src="/branding/empty-state.png" alt="" fill sizes="160px" className="object-contain" />
      </div>
      <p>{message}</p>
    </div>
  );
}
