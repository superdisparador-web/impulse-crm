"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { login } from "@/services/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("session") === "expired") {
      const timeout = window.setTimeout(() => {
        setError("Sua sessão expirou. Faça login novamente.");
      }, 0);
      window.history.replaceState({}, "", "/login");
      return () => window.clearTimeout(timeout);
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      await login(email, password);

      router.push("/dashboard");
    } catch {
      setError("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <Image
        src="/branding/login-background.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-slate-950/60" />
      <Image
        src="/branding/impulse-astronaut.png"
        alt=""
        width={1024}
        height={1536}
        sizes="(min-width: 1280px) 360px, 0px"
        className="pointer-events-none absolute bottom-0 left-[6%] z-[1] hidden h-[68vh] w-auto object-contain opacity-80 drop-shadow-2xl xl:block"
      />
      <form
        onSubmit={handleLogin}
        className="brand-enter relative z-10 w-full max-w-md rounded-3xl border border-white/15 bg-slate-950/80 p-6 shadow-[0_24px_80px_-28px_rgba(2,6,23,0.9)] backdrop-blur-xl sm:p-9 xl:ml-[32%]"
      >
        <Image
          src="/branding/impulse-logo-horizontal.png"
          alt="Impulse CRM"
          width={1536}
          height={1024}
          priority
          className="mx-auto mb-8 h-16 w-auto max-w-full object-contain sm:h-20"
        />

        <input
          type="email"
          aria-label="E-mail"
          autoComplete="email"
          required
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 h-12 w-full rounded-xl border border-slate-600/80 bg-slate-900/80 px-4 text-white shadow-inner outline-none transition duration-200 hover:border-slate-500 focus:border-blue-400 focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/20"
        />

        <input
          type="password"
          aria-label="Senha"
          autoComplete="current-password"
          required
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 h-12 w-full rounded-xl border border-slate-600/80 bg-slate-900/80 px-4 text-white shadow-inner outline-none transition duration-200 hover:border-slate-500 focus:border-blue-400 focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/20"
        />

        {error && (
          <p role="alert" className="mb-4 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 font-semibold text-white shadow-lg shadow-blue-950/30 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-400/30 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-70"
        >
          {loading && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white motion-reduce:animate-none" />}
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
