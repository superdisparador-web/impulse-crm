export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 p-8 shadow-2xl border border-slate-800">
        <h1 className="text-3xl font-bold text-white text-center">
          Impulse CRM
        </h1>

        <p className="text-slate-400 text-center mt-2">
          Faça login para continuar
        </p>

        <div className="mt-8 space-y-4">
          <input
            type="email"
            placeholder="E-mail"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none"
          />

          <input
            type="password"
            placeholder="Senha"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none"
          />

          <button className="w-full rounded-lg bg-green-600 hover:bg-green-700 py-3 text-white font-semibold transition">
            Entrar
          </button>
        </div>
      </div>
    </main>
  );
}