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
    <main
      className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-[#020817] bg-cover bg-center px-4 py-6 before:absolute before:inset-0 before:bg-slate-950/10 before:content-[''] after:pointer-events-none after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.08),transparent_42%)] after:content-[''] sm:px-6"
      style={{ backgroundImage: "url('/branding/login-background.png')" }}
    >
      <form
        onSubmit={handleLogin}
        className="brand-enter relative z-10 flex min-h-[560px] w-full max-w-[520px] flex-col justify-center overflow-hidden rounded-[28px] border border-white/20 bg-[rgba(8,14,28,0.78)] px-6 py-8 shadow-[0_40px_120px_-28px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-x-12 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-blue-300/70 before:to-transparent before:content-[''] sm:min-h-[610px] sm:px-12 sm:py-10"
      >
        <Image
          src="/branding/impulse-logo-horizontal.png"
          alt="Impulse CRM"
          width={1536}
          height={1024}
          priority
          className="relative mx-auto h-[82px] w-[246px] object-cover object-center drop-shadow-[0_8px_24px_rgba(59,130,246,0.22)] sm:h-[90px] sm:w-[270px]"
        />

        <h1 className="relative mt-5 text-center text-3xl font-bold tracking-[-0.035em] text-white drop-shadow-sm sm:text-[36px]">
          Bem-vindo de volta!
        </h1>
        <p className="relative mb-9 mt-3 text-center text-base leading-7 text-slate-300 sm:text-lg">
          Acesse sua conta para continuar
        </p>

        <label htmlFor="email" className="relative mb-2.5 text-sm font-semibold text-slate-100">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          aria-label="E-mail"
          autoComplete="email"
          required
          placeholder="seuemail@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="login-input relative h-14 w-full rounded-2xl border border-white/15 bg-slate-950/55 px-4 text-[15px] text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.24)] outline-none transition-all duration-200 placeholder:text-slate-500 hover:border-white/25 hover:bg-slate-950/65 focus:border-blue-400/80 focus:bg-slate-950/75 focus:ring-4 focus:ring-blue-500/15"
        />

        <label htmlFor="password" className="relative mb-2.5 mt-5 text-sm font-semibold text-slate-100">
          Senha
        </label>
        <input
          id="password"
          type="password"
          aria-label="Senha"
          autoComplete="current-password"
          required
          placeholder="Digite sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input relative h-14 w-full rounded-2xl border border-white/15 bg-slate-950/55 px-4 text-[15px] text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.24)] outline-none transition-all duration-200 placeholder:text-slate-500 hover:border-white/25 hover:bg-slate-950/65 focus:border-blue-400/80 focus:bg-slate-950/75 focus:ring-4 focus:ring-blue-500/15"
        />

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="relative mt-7 h-14 w-full rounded-[14px] border border-blue-300/20 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 px-4 text-lg font-semibold text-white shadow-[0_14px_30px_-12px_rgba(37,99,235,0.75),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-600 hover:via-blue-500 hover:to-cyan-500 hover:shadow-[0_18px_36px_-12px_rgba(37,99,235,0.8)] focus:outline-none focus:ring-4 focus:ring-blue-400/30 active:translate-y-0 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-70"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
