"use client";

import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { Organization } from "@/types/organization";
import type { ManualWhatsappAccountFormData } from "@/types/whatsapp";

type Props = {
  open: boolean;
  form: ManualWhatsappAccountFormData;
  organizations: Organization[];
  saving: boolean;
  error: string;
  onChange: (value: ManualWhatsappAccountFormData) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
};
const input =
  "mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm";
export function ManualAccountModal({
  open,
  form,
  organizations,
  saving,
  error,
  onChange,
  onClose,
  onSubmit,
}: Props) {
  const [showToken, setShowToken] = useState(false);
  return (
    <Modal
      isOpen={open}
      title="Cadastrar conta manualmente"
      width="lg"
      onClose={() => !saving && onClose()}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <p className="text-sm text-slate-500">
          Uso administrativo excepcional. A credencial será validada na Meta e
          criptografada antes do armazenamento.
        </p>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold sm:col-span-2">
            Organização
            <select
              required
              className={input}
              value={form.organizationId}
              onChange={(e) =>
                onChange({ ...form, organizationId: e.target.value })
              }
            >
              <option value="">Selecione a organização</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Nome interno
            <input
              required
              className={input}
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
            />
          </label>
          <label className="text-sm font-semibold">
            WABA ID
            <input
              required
              inputMode="numeric"
              pattern="[0-9]+"
              className={input}
              value={form.wabaId}
              onChange={(e) => onChange({ ...form, wabaId: e.target.value })}
            />
          </label>
          <label className="text-sm font-semibold">
            Phone Number ID
            <input
              required
              inputMode="numeric"
              pattern="[0-9]+"
              className={input}
              value={form.phoneNumberId}
              onChange={(e) =>
                onChange({ ...form, phoneNumberId: e.target.value })
              }
            />
          </label>
          <label className="text-sm font-semibold">
            Business Account ID
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              className={input}
              value={form.businessAccountId}
              onChange={(e) =>
                onChange({ ...form, businessAccountId: e.target.value })
              }
            />
          </label>
          <label className="text-sm font-semibold">
            Versão da API
            <input
              required
              pattern="v[0-9]+\.[0-9]+"
              className={input}
              value={form.apiVersion}
              onChange={(e) =>
                onChange({ ...form, apiVersion: e.target.value })
              }
            />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Access Token
            <span className="relative block">
              <input
                required
                minLength={20}
                type={showToken ? "text" : "password"}
                autoComplete="new-password"
                className={`${input} pr-11`}
                value={form.accessToken}
                onChange={(e) =>
                  onChange({ ...form, accessToken: e.target.value })
                }
              />
              <button
                type="button"
                className="absolute right-2 top-3 rounded p-1 text-slate-500"
                onClick={() => setShowToken((value) => !value)}
                aria-label={
                  showToken ? "Ocultar access token" : "Mostrar access token"
                }
              >
                {showToken ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
            <span className="mt-1 block text-xs font-normal text-slate-500">
              O token não será exibido novamente.
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={Boolean(form.isDefault)}
              onChange={(e) =>
                onChange({ ...form, isDefault: e.target.checked })
              }
            />
            Definir como conta padrão da organização
          </label>
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            Validar e cadastrar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
