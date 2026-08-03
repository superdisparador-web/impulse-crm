"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/auth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Surface } from "@/components/ui/Layout";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <main className="flex min-h-screen items-center justify-center ds-canvas">
      <Surface className="mx-4 w-full max-w-md p-8 ds-shadow-raised">
      <form onSubmit={handleLogin} className="space-y-5">
        <div className="mb-7 text-center">
          <span aria-hidden="true" className="text-xl">🚀</span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Impulse CRM</h1>
          <p className="mt-1 text-sm text-slate-400">Inteligência comercial</p>
        </div>

        <Input
          label="E-mail"
          type="email"
          placeholder="voce@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <Input
          label="Senha"
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && (
          <p role="alert" className="ds-alert border-red-900/70 bg-red-950/30 text-red-200">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading} fullWidth>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
      </Surface>
    </main>
  );
}
