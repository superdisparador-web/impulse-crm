"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  DatabaseZap,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { login } from "@/services/auth";

const benefits = [
  { label: "Segurança avançada", icon: ShieldCheck },
  { label: "Dados que geram valor", icon: DatabaseZap },
  { label: "Performance em tempo real", icon: BarChart3 },
];

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <main className="login-command-center relative isolate min-h-dvh overflow-hidden bg-[#020611] text-white">
      <Image
        src="/branding/login-background.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="login-space-background object-cover object-center"
      />
      <div className="login-scene-grade absolute inset-0" />
      <div aria-hidden="true" className="login-nebula absolute inset-0" />
      <div aria-hidden="true" className="login-stars login-stars-far absolute inset-0" />
      <div aria-hidden="true" className="login-stars login-stars-near absolute inset-0" />
      <div aria-hidden="true" className="login-horizon-glow absolute inset-x-0 bottom-0 h-[48%]" />
      <div aria-hidden="true" className="login-vignette absolute inset-0" />

      <div aria-hidden="true" className="login-orbit absolute -left-48 top-[48%] hidden size-[720px] -translate-y-1/2 rounded-full xl:block">
        <span className="login-orbit-node absolute left-1/2 top-0 size-1.5 rounded-full bg-cyan-200" />
        <span className="absolute inset-[74px] rounded-full border border-dashed border-blue-300/[0.08]" />
      </div>
      <div aria-hidden="true" className="login-flight-path absolute left-[8%] top-[22%] hidden h-px w-[34%] -rotate-[11deg] lg:block">
        <span className="login-spacecraft absolute right-0 top-1/2" />
      </div>

      <div aria-hidden="true" className="login-hud-layer absolute inset-0 hidden xl:block">
        <div className="login-hud login-hud-status left-[4.5%] top-[11%]">
          <span>System status</span><strong><i /> Online</strong>
        </div>
        <div className="login-hud login-hud-data left-[43%] top-[9%]">
          <span>Data stream</span><strong>99.98%</strong>
        </div>
        <div className="login-hud login-hud-secure bottom-[9%] left-[45%]">
          <span>Secure channel</span><strong>Active</strong>
        </div>
        <div className="login-hud login-hud-core bottom-[10%] right-[3%]">
          <span>Impulse core</span><strong>Synchronized</strong>
        </div>
      </div>

      <div className="relative z-10 mx-auto grid min-h-dvh w-full max-w-[1500px] items-center gap-12 px-5 py-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:px-14 lg:py-8 xl:gap-24 xl:px-20">
        <section className="login-narrative hidden max-w-[650px] self-end pb-14 lg:block xl:pb-20" aria-label="Impulse Command Center">
          <div className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.34em] text-cyan-100/80">
            <span className="h-px w-12 bg-gradient-to-r from-cyan-300 to-transparent" />
            Impulse Command Center
          </div>
          <h2 className="max-w-[620px] text-[46px] font-medium leading-[1.03] tracking-[-0.04em] text-white xl:text-[60px]">
            Tecnologia que <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-blue-300 to-indigo-300">impulsiona</span> resultados.
          </h2>
          <p className="mt-5 max-w-[520px] text-[17px] leading-7 text-slate-300/85">
            Inteligência, performance e controle em uma única plataforma.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            {benefits.map(({ label, icon: Icon }) => (
              <div key={label} className="login-benefit-chip flex items-center gap-2 rounded-full border border-white/[0.08] bg-slate-950/35 px-3 py-2 text-[11px] text-slate-300 backdrop-blur-md">
                <Icon aria-hidden="true" className="size-3.5 text-cyan-300/80" />
                {label}
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-300/80">
            <span className="relative flex size-3 items-center justify-center">
              <span className="login-status-halo absolute size-3 rounded-full bg-emerald-400/30" />
              <span className="relative size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
            </span>
            Sistema operacional
          </div>
        </section>

        <section className="brand-enter login-panel-wrap mx-auto flex w-full max-w-[440px] flex-col justify-center py-2 sm:py-6">
          <form
            onSubmit={handleLogin}
            className="login-glass-panel relative overflow-hidden rounded-[28px] border border-cyan-100/[0.14] px-5 py-6 backdrop-blur-2xl sm:px-9 sm:py-8"
          >
            <div aria-hidden="true" className="login-panel-scan absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/90 to-transparent" />

            <p className="text-center text-[9px] font-semibold uppercase tracking-[0.38em] text-cyan-200/65">Impulse Command Center</p>
            <div className="login-logo-shell relative mx-auto mt-2 h-[70px] w-[232px] overflow-hidden sm:h-[76px] sm:w-[250px]">
              <Image
                src="/branding/impulse-logo-horizontal.png"
                alt="Impulse CRM"
                fill
                priority
                sizes="255px"
                className="scale-[1.07] object-cover object-center drop-shadow-[0_0_18px_rgba(56,189,248,0.28)]"
              />
            </div>

            <div className="mt-4 text-center">
              <h1 className="text-[27px] font-semibold tracking-[-0.035em] text-white sm:text-[30px]">Bem-vindo de volta!</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400 sm:text-[15px]">
                Acesse sua conta e continue impulsionando resultados.
              </p>
            </div>

            <div className="mt-6">
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">E-mail</label>
              <div className="group relative">
                <Mail aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-cyan-300" />
                <input id="email" type="email" autoComplete="email" required placeholder="seuemail@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} className="login-input h-[52px] w-full rounded-xl border border-white/[0.11] bg-slate-950/50 pl-11 pr-4 text-[15px] text-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.35),inset_0_0_0_1px_rgba(255,255,255,0.015)] outline-none transition duration-200 placeholder:text-slate-500 hover:border-white/20 focus:border-cyan-300/60 focus:bg-slate-950/70 focus:ring-4 focus:ring-cyan-400/10" />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">Senha</label>
              <div className="group relative">
                <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-cyan-300" />
                <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required placeholder="Digite sua senha" value={password} onChange={(e) => setPassword(e.target.value)} className="login-input h-[52px] w-full rounded-xl border border-white/[0.11] bg-slate-950/50 pl-11 pr-12 text-[15px] text-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.35),inset_0_0_0_1px_rgba(255,255,255,0.015)] outline-none transition duration-200 placeholder:text-slate-500 hover:border-white/20 focus:border-cyan-300/60 focus:bg-slate-950/70 focus:ring-4 focus:ring-cyan-400/10" />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} aria-pressed={showPassword} className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-slate-200 focus-visible:text-cyan-300">
                  {showPassword ? <EyeOff aria-hidden="true" className="size-[18px]" /> : <Eye aria-hidden="true" className="size-[18px]" />}
                </button>
              </div>
            </div>

            {error && <p role="alert" className="mt-4 rounded-xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

            <button type="submit" disabled={loading} aria-busy={loading} className="login-submit group relative mt-6 flex h-[54px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-cyan-200/20 px-4 text-[15px] font-semibold text-white transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-blue-400/25 active:translate-y-0 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60">
              <span>{loading ? "Entrando..." : "Entrar na plataforma"}</span>
              {!loading && <ArrowRight aria-hidden="true" className="size-[18px] transition-transform group-hover:translate-x-0.5" />}
            </button>

            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-500 lg:hidden">
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
              Sistema operacional
            </div>
          </form>

          <div className="mt-3 grid grid-cols-3 gap-2 px-1 lg:hidden">
            {benefits.map(({ label, icon: Icon }) => (
              <div key={label} className="flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border border-white/[0.07] bg-slate-950/35 px-1.5 text-center backdrop-blur-sm">
                <Icon aria-hidden="true" className="size-4 text-cyan-300/80" />
                <span className="text-[10px] leading-3.5 text-slate-400 sm:text-[11px]">{label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="login-institutional-footer absolute bottom-5 left-8 z-20 hidden items-center gap-3 text-[9px] uppercase tracking-[0.22em] text-slate-400/45 lg:flex xl:left-12">
        <span>Versão 1.0.0</span>
        <span aria-hidden="true" className="h-3 w-px bg-cyan-200/15" />
        <span>Powered by Impulse Labs</span>
      </footer>
    </main>
  );
}
