import { AlertTriangle, LoaderCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { WhatsappAccount } from "@/types/whatsapp";

export function ArchiveModal({
  account,
  saving,
  onCancel,
  onConfirm,
}: {
  account: WhatsappAccount | null;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      isOpen={Boolean(account)}
      title="Arquivar conta WhatsApp"
      onClose={() => !saving && onCancel()}
      width="sm"
    >
      <div className="flex gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <AlertTriangle size={22} />
        </span>
        <div>
          <h3 className="font-semibold text-slate-900">
            Arquivar {account?.name}?
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            A conta será removida da lista de contas ativas por soft delete e
            poderá ser restaurada posteriormente.
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onConfirm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {saving && <LoaderCircle className="animate-spin" size={16} />}
          {saving ? "Arquivando..." : "Arquivar conta"}
        </button>
      </div>
    </Modal>
  );
}
