export default function SettingsPage() {
  return (
    <main className="space-y-6">
      <header><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Configurações</h1><p className="mt-2 max-w-2xl text-slate-500">Personalize sua experiência e consulte as preferências disponíveis para sua empresa.</p></header>
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold text-slate-900">Perfil e acesso</h2><p className="mt-2 text-sm leading-6 text-slate-500">Seus dados pessoais e permissões são administrados pela equipe responsável da sua empresa.</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold text-slate-900">Preferências da empresa</h2><p className="mt-2 text-sm leading-6 text-slate-500">Novas opções de personalização aparecerão aqui quando estiverem disponíveis para sua conta.</p></article>
      </section>
    </main>
  );
}
