"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [dados, setDados] = useState({
    whatsapps: 0,
    contacts: 0,
    campaigns: 0,
    today: 0,
  });

  useEffect(() => {
    fetch("http://localhost:3000/dashboard")
      .then((res) => res.json())
      .then((data) => setDados(data));
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-4 gap-6">

        <div className="bg-slate-900 rounded-xl p-6">
          <h2 className="text-gray-400">WhatsApps</h2>
          <p className="text-3xl font-bold text-green-500">
            {dados.whatsapps}
          </p>
        </div>

        <div className="bg-slate-900 rounded-xl p-6">
          <h2 className="text-gray-400">Contatos</h2>
          <p className="text-3xl font-bold">
            {dados.contacts}
          </p>
        </div>

        <div className="bg-slate-900 rounded-xl p-6">
          <h2 className="text-gray-400">Campanhas</h2>
          <p className="text-3xl font-bold">
            {dados.campaigns}
          </p>
        </div>

        <div className="bg-slate-900 rounded-xl p-6">
          <h2 className="text-gray-400">Mensagens Hoje</h2>
          <p className="text-3xl font-bold text-blue-400">
            {dados.today}
          </p>
        </div>

      </div>
    </main>
  );
}