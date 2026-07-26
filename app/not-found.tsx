import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-[calc(100vh-7rem)] items-end overflow-hidden rounded-3xl border border-slate-800/20 bg-slate-950 p-5 shadow-xl sm:p-10">
      <Image src="/branding/404-background.png" alt="" fill priority sizes="(max-width: 1024px) 100vw, 80vw" className="object-cover object-center" />
      <div className="absolute inset-0 bg-slate-950/35" />
      <div className="relative max-w-xl rounded-3xl border border-white/10 bg-slate-950/75 p-6 text-white shadow-2xl backdrop-blur-md sm:p-8">
        <p className="font-semibold uppercase tracking-[0.2em] text-blue-300">Erro 404</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-5xl">Página não encontrada</h1>
        <p className="mt-3 max-w-md leading-6 text-slate-200">O endereço acessado não existe ou não está mais disponível.</p>
        <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-950/30 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-300/40">Voltar ao Dashboard</Link>
      </div>
    </main>
  );
}
