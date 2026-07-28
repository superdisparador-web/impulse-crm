import {
  Archive,
  CheckCircle2,
  Edit3,
  Power,
  RefreshCw,
  RotateCcw,
  Star,
} from "lucide-react";
import { WhatsappAccount } from "@/types/whatsapp";

interface ActionButtonsProps {
  account: WhatsappAccount;
  busy: boolean;
  onEdit: (account: WhatsappAccount) => void;
  onTest: (account: WhatsappAccount) => void;
  onSync: (account: WhatsappAccount) => void;
  onDefault: (account: WhatsappAccount) => void;
  onToggle: (account: WhatsappAccount) => void;
  onArchive: (account: WhatsappAccount) => void;
  onRestore: (account: WhatsappAccount) => void;
}

const iconButton =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50";

export function ActionButtons({
  account,
  busy,
  onEdit,
  onTest,
  onSync,
  onDefault,
  onToggle,
  onArchive,
  onRestore,
}: ActionButtonsProps) {
  const unavailable = busy || Boolean(account.deletedAt);
  return (
    <div
      className="flex min-w-52 flex-wrap justify-end gap-2"
      aria-label={`Ações da conta ${account.name}`}
    >
      <button
        type="button"
        className={iconButton}
        onClick={() => onEdit(account)}
        aria-label={`Editar ${account.name}`}
        title="Editar conta"
      >
        <Edit3 size={16} />
      </button>
      <button
        type="button"
        className={iconButton}
        disabled={unavailable}
        onClick={() => onTest(account)}
        aria-label={`Testar conexão de ${account.name}`}
        title="Testar conexão"
      >
        <CheckCircle2 className={busy ? "animate-pulse" : ""} size={16} />
      </button>
      <button
        type="button"
        className={iconButton}
        disabled={unavailable}
        onClick={() => onSync(account)}
        aria-label={`Sincronizar ${account.name}`}
        title="Sincronizar conta"
      >
        <RefreshCw className={busy ? "animate-spin" : ""} size={16} />
      </button>
      <button
        type="button"
        className={iconButton}
        disabled={unavailable || account.isDefault}
        onClick={() => onDefault(account)}
        aria-label={`Definir ${account.name} como padrão`}
        title="Definir como padrão"
      >
        <Star size={16} />
      </button>
      <button
        type="button"
        className={iconButton}
        disabled={unavailable}
        onClick={() => onToggle(account)}
        aria-label={`${account.status === "ACTIVE" ? "Desativar" : "Ativar"} ${account.name}`}
        title={account.status === "ACTIVE" ? "Desativar conta" : "Ativar conta"}
      >
        <Power size={16} />
      </button>
      {account.deletedAt ? (
        <button
          type="button"
          className={iconButton}
          disabled={busy}
          onClick={() => onRestore(account)}
          aria-label={`Restaurar ${account.name}`}
          title="Restaurar conta"
        >
          <RotateCcw size={16} />
        </button>
      ) : (
        <button
          type="button"
          className={`${iconButton} border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700`}
          disabled={busy}
          onClick={() => onArchive(account)}
          aria-label={`Arquivar ${account.name}`}
          title="Arquivar conta"
        >
          <Archive size={16} />
        </button>
      )}
    </div>
  );
}
