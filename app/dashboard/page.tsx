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
    <>
      <h1 className="text-4xl font-bold mb-8 text-slate-900">
        Dashboard
      </h1>

      <div className="grid grid-cols-4 gap-6">
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-slate-500">WhatsApps</h2>
          <p className="text-3xl font-bold text-green-600">
            {dados.whatsapps}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-slate-500">Contatos</h2>
          <p className="text-3xl font-bold">
            {dados.contacts}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-slate-500">Campanhas</h2>
          <p className="text-3xl font-bold">
            {dados.campaigns}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-slate-500">Mensagens Hoje</h2>
          <p className="text-3xl font-bold text-blue-600">
            {dados.today}
          </p>
        </div>
      </div>
    </>
  );
}