"use client";

interface AgentFormProps {
  onCancel: () => void;
  onSave: () => void;
}

export default function AgentForm({
  onCancel,
  onSave,
}: AgentFormProps) {
  return (
    <form className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Nome
          </label>

          <input
            type="text"
            placeholder="Nome do agente"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            WhatsApp
          </label>

          <input
            type="text"
            placeholder="11999999999"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-2">
          E-mail
        </label>

        <input
          type="email"
          placeholder="email@empresa.com"
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Região
          </label>

          <input
            type="text"
            placeholder="Zona Sul"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Peso
          </label>

          <input
            type="number"
            defaultValue={1}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Máx. Leads
          </label>

          <input
            type="number"
            defaultValue={20}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-2">
          Status
        </label>

        <select
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
          defaultValue="true"
        >
          <option value="true">Ativo</option>
          <option value="false">Inativo</option>
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-600 px-6 py-3 text-white hover:bg-slate-800 transition"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={onSave}
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}