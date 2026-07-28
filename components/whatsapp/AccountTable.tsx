import { MessageCircleMore, Plus } from "lucide-react";
import { WhatsappAccount } from "@/types/whatsapp";
import { ActionButtons } from "./ActionButtons";
import { StatusBadge } from "./StatusBadge";

interface AccountTableProps {
  accounts: WhatsappAccount[];
  loading: boolean;
  busyId: string | null;
  page: number;
  totalPages: number;
  hasFilters: boolean;
  onPageChange: (page: number) => void;
  onConnect: () => void;
  onClearFilters: () => void;
  onEdit: (account: WhatsappAccount) => void;
  onTest: (account: WhatsappAccount) => void;
  onSync: (account: WhatsappAccount) => void;
  onDefault: (account: WhatsappAccount) => void;
  onToggle: (account: WhatsappAccount) => void;
  onArchive: (account: WhatsappAccount) => void;
  onRestore: (account: WhatsappAccount) => void;
  formatDate: (value?: string | null) => string;
  mask: (value?: string | null) => string;
}

function LoadingRows() {
  return Array.from({ length: 4 }, (_, index) => (
    <tr key={index} className="border-t border-slate-200" aria-hidden="true">
      {Array.from({ length: 5 }, (__, cell) => (
        <td key={cell} className="px-5 py-5">
          <div
            className={`h-4 animate-pulse rounded bg-slate-100 ${cell === 4 ? "ml-auto w-40" : "w-28"}`}
          />
        </td>
      ))}
    </tr>
  ));
}

export function AccountTable(props: AccountTableProps) {
  const {
    accounts,
    loading,
    busyId,
    page,
    totalPages,
    hasFilters,
    onPageChange,
    onConnect,
    onClearFilters,
    formatDate,
    mask,
  } = props;
  return (
    <section
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      aria-label="Contas WhatsApp"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-5 py-4">Conta</th>
              <th className="px-5 py-4">Identificadores Meta</th>
              <th className="px-5 py-4">Situação</th>
              <th className="px-5 py-4">Atividade</th>
              <th className="px-5 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows />
            ) : (
              accounts.map((account) => (
                <tr
                  key={account.id}
                  className="border-t border-slate-200 transition hover:bg-slate-50/70"
                >
                  <td className="px-5 py-5 align-top">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900">{account.name}</strong>
                      {account.isDefault && (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                          Padrão
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-slate-600">
                      {account.displayPhoneNumber ||
                        account.phoneNumber ||
                        "Número não informado"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {account.verifiedName || "Nome verificado pendente"}
                    </p>
                  </td>
                  <td className="px-5 py-5 align-top font-mono text-xs">
                    <p>
                      <span className="font-sans text-slate-500">WABA:</span>{" "}
                      {mask(account.wabaId)}
                    </p>
                    <p className="mt-1">
                      <span className="font-sans text-slate-500">
                        Phone ID:
                      </span>{" "}
                      {mask(account.phoneNumberId)}
                    </p>
                    <p className="mt-1 font-sans text-slate-500">
                      Token:{" "}
                      {account.tokenConfigured
                        ? `•••• ${account.tokenLast4 || ""}`
                        : "Não configurado"}
                    </p>
                  </td>
                  <td className="px-5 py-5 align-top">
                    <StatusBadge status={account.status} />
                    {account.qualityRating && (
                      <p className="mt-2 text-xs text-slate-500">
                        Qualidade:{" "}
                        <span className="font-medium text-slate-700">
                          {account.qualityRating}
                        </span>
                      </p>
                    )}
                    {account.messagingLimitTier && (
                      <p className="mt-1 text-xs text-slate-500">
                        Limite:{" "}
                        <span className="font-medium text-slate-700">
                          {account.messagingLimitTier}
                        </span>
                      </p>
                    )}
                    {account.lastConnectionError && (
                      <p className="mt-2 max-w-64 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                        {account.lastConnectionError}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-5 align-top text-xs text-slate-500">
                    <p>
                      Teste:{" "}
                      <span className="text-slate-700">
                        {formatDate(account.lastConnectionTestAt)}
                      </span>
                    </p>
                    <p className="mt-1">
                      Sincronização:{" "}
                      <span className="text-slate-700">
                        {formatDate(account.lastSyncAt)}
                      </span>
                    </p>
                    <p className="mt-1">
                      Conexão:{" "}
                      <span className="text-slate-700">
                        {formatDate(account.connectedAt)}
                      </span>
                    </p>
                  </td>
                  <td className="px-5 py-5 align-top">
                    <ActionButtons
                      account={account}
                      busy={busyId === account.id}
                      onEdit={props.onEdit}
                      onTest={props.onTest}
                      onSync={props.onSync}
                      onDefault={props.onDefault}
                      onToggle={props.onToggle}
                      onArchive={props.onArchive}
                      onRestore={props.onRestore}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && accounts.length === 0 && (
        <div className="flex flex-col items-center border-t border-slate-200 px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <MessageCircleMore size={27} />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            {hasFilters
              ? "Nenhuma conta encontrada"
              : "Nenhuma conta WhatsApp conectada"}
          </h2>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            {hasFilters
              ? "Nenhuma conta corresponde aos filtros selecionados."
              : "Conecte um número da API Oficial para começar a gerenciar mensagens pelo Impulse CRM."}
          </p>
          <button
            type="button"
            onClick={hasFilters ? onClearFilters : onConnect}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
          >
            {!hasFilters && <Plus size={16} />}
            {hasFilters ? "Limpar filtros" : "Conectar primeira conta"}
          </button>
        </div>
      )}
      {!loading && accounts.length > 0 && (
        <footer className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>
          <span>
            Página <strong className="text-slate-700">{page}</strong> de{" "}
            {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Próxima
          </button>
        </footer>
      )}
    </section>
  );
}
