import Image from "next/image";

interface EmptyStateProps {
  message: string;
}

export default function EmptyState({
  message,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-blue-50/60 to-slate-50/80 p-5 text-center text-sm leading-6 text-slate-500 sm:p-6">
      <div className="relative mb-3 h-24 w-full max-w-40 drop-shadow-[0_12px_20px_rgba(37,99,235,0.1)]">
        <Image src="/branding/empty-state.png" alt="" fill sizes="160px" className="object-contain" />
      </div>
      <p>{message}</p>
    </div>
  );
}
