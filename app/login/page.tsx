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
      className="relative flex min-h-dvh items-center justify-center bg-[#020817] bg-cover bg-center px-4 py-6 before:absolute before:inset-0 before:bg-slate-950/10 before:content-[''] sm:px-6"
      style={{ backgroundImage: "url('/branding/login-background.png')" }}
    >
      <form
        onSubmit={handleLogin}
        className="brand-enter relative z-10 flex min-h-[560px] w-full max-w-[520px] flex-col justify-center rounded-3xl border border-white/15 bg-[rgba(8,14,28,0.78)] px-6 py-8 shadow-[0_32px_100px_-24px_rgba(0,0,0,0.75)] backdrop-blur-2xl sm:min-h-[610px] sm:px-12 sm:py-10"
      >
        <Image
          src="/branding/impulse-logo-horizontal.png"
          alt="Impulse CRM"
          width={1536}
          height={1024}
          priority
          className="mx-auto h-[76px] w-[228px] object-cover object-center sm:h-[82px] sm:w-[245px]"
        />

        <h1 className="mt-5 text-center text-3xl font-bold tracking-[-0.025em] text-white sm:text-[34px]">
          Bem-vindo de volta!
        </h1>
        <p className="mb-9 mt-3 text-center text-base text-slate-300 sm:text-lg">
          Acesse sua conta para continuar
        </p>

        <label htmlFor="email" className="mb-2.5 text-sm font-medium text-slate-100">
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
          className="h-14 w-full rounded-2xl border border-slate-500/60 bg-slate-950/55 px-4 text-white shadow-inner outline-none transition duration-200 placeholder:text-slate-500 hover:border-slate-400/70 focus:border-blue-400 focus:bg-slate-950/75 focus:ring-4 focus:ring-blue-500/15"
        />

        <label htmlFor="password" className="mb-2.5 mt-5 text-sm font-medium text-slate-100">
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
          className="h-14 w-full rounded-2xl border border-slate-500/60 bg-slate-950/55 px-4 text-white shadow-inner outline-none transition duration-200 placeholder:text-slate-500 hover:border-slate-400/70 focus:border-blue-400 focus:bg-slate-950/75 focus:ring-4 focus:ring-blue-500/15"
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
          className="mt-7 h-14 w-full rounded-[14px] bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 px-4 text-lg font-semibold text-white shadow-lg shadow-blue-950/40 transition duration-200 hover:-translate-y-0.5 hover:from-blue-600 hover:via-blue-500 hover:to-cyan-500 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-400/30 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-70"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
