"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { WhatsappAccount } from "@/types/whatsapp";

function mask(value?: string | null) {
  if (!value) {
    return "Não informado";
  }

  if (value.length < 7) {
    return "••••";
  }

  return `${value.slice(0, 3)}••••${value.slice(-3)}`;
}

type Props = {
  account: WhatsappAccount | null;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (accessToken: string) => Promise<void>;
};

export function AccessTokenModal({
  account,
  saving,
  error,
  onClose,
  onSubmit,
}: Props) {
  const [accessToken, setAccessToken] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!account) {
      setAccessToken("");
      setVisible(false);
    }
  }, [account]);

  function close() {
    if (saving) {
      return;
    }

    setAccessToken("");
    setVisible(false);
    onClose();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedToken = accessToken.trim();

    if (saving || normalizedToken.length < 20) {
      return;
    }

    await onSubmit(normalizedToken);
  }

  return (
    <Modal
      isOpen={Boolean(account)}
      title="Atualizar credencial do WhatsApp"
      onClose={close}
    >
      {account && (
        <form onSubmit={submit} className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <strong className="block text-sm font-bold text-slate-950">
              {account.verifiedName || account.name || "WhatsApp Oficial"}
            </strong>

            <p className="mt-1 text-sm text-slate-600">
              {account.displayPhoneNumber ||
                account.phoneNumber ||
                "Número não informado"}
            </p>

            <div className="mt-3 space-y-1 font-mono text-xs text-slate-500">
              <p>WABA: {mask(account.wabaId)}</p>
              <p>Phone ID: {mask(account.phoneNumberId)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            O token atual nunca será exibido. O novo token será validado com a
            Meta e armazenado de forma criptografada.
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <label className="block">
            <span className="text-sm font-semibold text-slate-800">
              Novo Access Token
            </span>

            <div className="relative mt-2">
              <Input
                autoFocus
                type={visible ? "text" : "password"}
                autoComplete="new-password"
                value={accessToken}
                onChange={(event) => setAccessToken(event.target.value)}
                required
                minLength={20}
                placeholder="Cole aqui o novo token da Meta"
                className="pr-11"
              />

              <button
                type="button"
                onClick={() => setVisible((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label={visible ? "Ocultar token" : "Mostrar token"}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <span className="mt-2 block text-xs text-slate-500">
              O token deve possuir pelo menos 20 caracteres.
            </span>
          </label>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={close}
              disabled={saving}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              loading={saving}
              disabled={accessToken.trim().length < 20}
            >
              Validar e atualizar
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
