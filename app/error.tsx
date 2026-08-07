"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="relative flex min-h-[calc(100dvh-7rem)] items-end overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-5 shadow-[0_24px_60px_-24px_rgba(2,6,23,0.5)] sm:p-10">
      <Image
        src="/branding/500-background.png"
        alt=""
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 80vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-slate-950/40" />
      <div className="relative max-w-xl rounded-3xl border border-white/15 bg-slate-950/70 p-6 text-white shadow-[0_28px_70px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-8">
        <p className="font-semibold uppercase tracking-[0.2em] text-blue-300">
          Erro 500
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-5xl">
          Algo não saiu como esperado
        </h1>
        <p className="mt-3 max-w-md leading-6 text-slate-200">
          Não foi possível concluir esta operação. Você pode tentar novamente ou
          voltar ao início.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 font-semibold text-white transition duration-200 hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/20"
          >
            Tentar novamente
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-950/30 transition duration-200 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-300/40"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
