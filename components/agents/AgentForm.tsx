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
            className="w-full ds-radius-control ds-surface-raised border ds-border px-4 py-3 text-white outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            WhatsApp
          </label>

          <input
            type="text"
            placeholder="11999999999"
            className="w-full ds-radius-control ds-surface-raised border ds-border px-4 py-3 text-white outline-none focus:border-blue-500"
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
          className="w-full ds-radius-control ds-surface-raised border ds-border px-4 py-3 text-white outline-none focus:border-blue-500"
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
            className="w-full ds-radius-control ds-surface-raised border ds-border px-4 py-3 text-white outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Peso
          </label>

          <input
            type="number"
            defaultValue={1}
            className="w-full ds-radius-control ds-surface-raised border ds-border px-4 py-3 text-white outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Máx. Leads
          </label>

          <input
            type="number"
            defaultValue={20}
            className="w-full ds-radius-control ds-surface-raised border ds-border px-4 py-3 text-white outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-2">
          Status
        </label>

        <select
          className="w-full ds-radius-control ds-surface-raised border ds-border px-4 py-3 text-white outline-none focus:border-blue-500"
          defaultValue="true"
        >
          <option value="true">Ativo</option>
          <option value="false">Inativo</option>
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t ds-border">
        <button
          type="button"
          onClick={onCancel}
          className="ds-radius-control border border-slate-600 px-6 py-3 text-white ds-secondary-hover transition"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={onSave}
          className="ds-radius-control ds-primary px-6 py-3 text-white ds-primary-hover transition"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}