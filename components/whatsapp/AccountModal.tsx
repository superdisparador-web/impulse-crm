"use client";

import {
  Check,
  Clipboard,
  Eye,
  EyeOff,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { FormEvent, RefObject, useState } from "react";
import Modal from "@/components/ui/Modal";
import { WhatsappAccount, WhatsappAccountFormData } from "@/types/whatsapp";

interface AccountModalProps {
  account: WhatsappAccount | null;
  form: WhatsappAccountFormData;
  saving: boolean;
  error: string;
  firstInputRef: RefObject<HTMLInputElement | null>;
  onChange: (form: WhatsappAccountFormData) => void;
  onGenerateVerifyToken: () => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}

const field =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
      {children}
      {required && (
        <span className="ml-1 text-red-500" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

export function AccountModal({
  account,
  form,
  saving,
  error,
  firstInputRef,
  onChange,
  onGenerateVerifyToken,
  onClose,
  onSubmit,
}: AccountModalProps) {
  const [showToken, setShowToken] = useState(false);
  const [verifyCopied, setVerifyCopied] = useState(false);
  const editing = Boolean(account?.id);

  return (
    <Modal
      isOpen={Boolean(account)}
      title={editing ? "Editar conta WhatsApp" : "Conectar WhatsApp Oficial"}
      onClose={() => !saving && onClose()}
      width="lg"
    >
      <form onSubmit={onSubmit} className="text-slate-900">
        <p className="-mt-1 mb-6 text-sm text-slate-500">
          Informe os dados fornecidos pelo painel da Meta para conectar o número
          ao Impulse CRM.
        </p>
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <fieldset disabled={saving} className="space-y-6">
          <section aria-labelledby="identification-title">
            <div className="mb-4">
              <h3
                id="identification-title"
                className="font-semibold text-slate-900"
              >
                Identificação
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Dados usados para reconhecer a conta dentro do CRM.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="whatsapp-name" required>
                  Nome interno
                </FieldLabel>
                <input
                  ref={firstInputRef}
                  id="whatsapp-name"
                  value={form.name}
                  onChange={(event) =>
                    onChange({ ...form, name: event.target.value })
                  }
                  className={field}
                  placeholder="Ex.: Atendimento comercial"
                  required
                />
              </div>
              <div>
                <FieldLabel htmlFor="whatsapp-phone">Número exibido</FieldLabel>
                <input
                  id="whatsapp-phone"
                  value={form.phoneNumber}
                  onChange={(event) =>
                    onChange({ ...form, phoneNumber: event.target.value })
                  }
                  className={field}
                  placeholder="Ex.: +55 11 99999-9999"
                />
              </div>
            </div>
          </section>

          <section
            className="border-t border-slate-200 pt-6"
            aria-labelledby="meta-title"
          >
            <div className="mb-4">
              <h3 id="meta-title" className="font-semibold text-slate-900">
                Dados da Meta
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Copie os identificadores exatamente como aparecem no WhatsApp
                Manager.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="waba-id" required>
                  WABA ID
                </FieldLabel>
                <input
                  id="waba-id"
                  value={form.wabaId}
                  onChange={(event) =>
                    onChange({ ...form, wabaId: event.target.value })
                  }
                  className={field}
                  placeholder="Ex.: 123456789012345"
                  required
                />
              </div>
              <div>
                <FieldLabel htmlFor="business-id">
                  Business Account ID
                </FieldLabel>
                <input
                  id="business-id"
                  value={form.businessAccountId}
                  onChange={(event) =>
                    onChange({ ...form, businessAccountId: event.target.value })
                  }
                  className={field}
                  placeholder="Ex.: 123456789012345"
                />
              </div>
              <div>
                <FieldLabel htmlFor="phone-number-id" required>
                  Phone Number ID
                </FieldLabel>
                <input
                  id="phone-number-id"
                  value={form.phoneNumberId}
                  onChange={(event) =>
                    onChange({ ...form, phoneNumberId: event.target.value })
                  }
                  className={field}
                  placeholder="Ex.: 123456789012345"
                  required
                />
              </div>
              <div>
                <FieldLabel htmlFor="api-version">Versão da API</FieldLabel>
                <input
                  id="api-version"
                  value={form.apiVersion}
                  onChange={(event) =>
                    onChange({ ...form, apiVersion: event.target.value })
                  }
                  className={field}
                  placeholder="Ex.: v20.0"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Deve coincidir com a versão utilizada pela integração.
                </p>
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="access-token" required={!editing}>
                  Access Token
                </FieldLabel>
                <div className="relative">
                  <input
                    id="access-token"
                    type={showToken ? "text" : "password"}
                    value={form.credential}
                    onChange={(event) =>
                      onChange({ ...form, credential: event.target.value })
                    }
                    className={`${field} pr-11`}
                    placeholder={
                      editing
                        ? "Deixe vazio para manter o token atual"
                        : "Cole o token permanente da Meta"
                    }
                    required={!editing}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setShowToken((value) => !value)}
                    className="absolute right-1.5 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                    aria-label={
                      showToken
                        ? "Ocultar access token"
                        : "Mostrar access token"
                    }
                    title={showToken ? "Ocultar token" : "Mostrar token"}
                  >
                    {showToken ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  {editing
                    ? "Deixar vazio mantém o token configurado atualmente."
                    : "O token será enviado com segurança e não será exibido após salvar."}
                </p>
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="verify-token">Verify Token</FieldLabel>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="verify-token"
                    value={form.verifyToken}
                    onChange={(event) =>
                      onChange({ ...form, verifyToken: event.target.value })
                    }
                    className={`${field} min-w-0 flex-1 font-mono`}
                    placeholder={
                      editing
                        ? "Deixe vazio para manter o atual"
                        : "Token gerado automaticamente"
                    }
                  />
                  <div className="mt-1.5 flex gap-2">
                    <button
                      type="button"
                      disabled={saving || !form.verifyToken}
                      onClick={() =>
                        void navigator.clipboard
                          .writeText(form.verifyToken || "")
                          .then(() => setVerifyCopied(true))
                      }
                      className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      aria-label="Copiar Verify Token"
                    >
                      {verifyCopied ? (
                        <Check size={16} className="text-emerald-600" />
                      ) : (
                        <Clipboard size={16} />
                      )}
                      <span className="sm:hidden">
                        {verifyCopied ? "Copiado" : "Copiar"}
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        onGenerateVerifyToken();
                        setVerifyCopied(false);
                      }}
                      className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      aria-label="Gerar outro Verify Token"
                    >
                      <RefreshCw size={16} />
                      <span className="sm:hidden">Gerar outro</span>
                    </button>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Use este valor ao configurar o webhook no painel da Meta.
                </p>
              </div>
            </div>
          </section>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span>
              <span className="block text-sm font-semibold text-slate-900">
                Conta ativa
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Permite utilizar esta conta nas operações do CRM.
              </span>
            </span>
            <input
              type="checkbox"
              className="peer sr-only"
              checked={Boolean(form.active)}
              onChange={(event) =>
                onChange({ ...form, active: event.target.checked })
              }
            />
            <span
              className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-blue-600 peer-focus-visible:ring-4 peer-focus-visible:ring-blue-100 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition peer-checked:after:translate-x-5"
              aria-hidden="true"
            />
          </label>
        </fieldset>

        <div className="sticky -bottom-6 mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:opacity-50"
          >
            {saving && <LoaderCircle className="animate-spin" size={17} />}
            {saving
              ? "Salvando..."
              : editing
                ? "Salvar alterações"
                : "Conectar conta"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
