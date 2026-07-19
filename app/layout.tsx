import "./globals.css";
import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-950 text-white">
        <div className="flex min-h-screen">

          <aside className="w-72 bg-slate-900 border-r border-slate-800 p-6">

            <h1 className="text-2xl font-bold mb-10">
              🚀 Impulse CRM
            </h1>

            <nav className="space-y-2 mt-8">

              <Link
                href="/dashboard"
                className="block rounded-lg px-4 py-3 hover:bg-slate-800 transition"
              >
                📊 Dashboard
              </Link>

              <Link
                href="/connections"
                className="block rounded-lg px-4 py-3 hover:bg-slate-800 transition"
              >
                📱 WhatsApps
              </Link>

              <Link
                href="/contacts"
                className="block rounded-lg px-4 py-3 hover:bg-slate-800 transition"
              >
                👥 Contatos
              </Link>

              <Link
                href="/campaigns"
                className="block rounded-lg px-4 py-3 hover:bg-slate-800 transition"
              >
                🚀 Campanhas
              </Link>

              <Link
                href="/settings"
                className="block rounded-lg px-4 py-3 hover:bg-slate-800 transition"
              >
                ⚙️ Configurações
              </Link>

            </nav>

          </aside>

          <main className="flex-1 p-8">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}