"use client";

import {
  CheckCircle2,
  ClipboardPaste,
  Pencil,
  Phone,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/crm";
import {
  normalizeCampaignPhone,
  parseBulkPhoneRecords,
} from "@/lib/campaign-phone";

export type ManualRecipient = {
  id: string;
  name: string;
  original: string;
  e164?: string;
  error?: string;
  duplicate?: boolean;
};

export default function ManualAudiencePanel({
  value,
  onChange,
  onSave,
  busy,
}: {
  value: ManualRecipient[];
  onChange: (value: ManualRecipient[]) => void;
  onSave: () => void | Promise<void>;
  busy: boolean;
}) {
  const [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [country, setCountry] = useState("55"),
    [bulk, setBulk] = useState(""),
    [bulkOpen, setBulkOpen] = useState(false),
    [saved, setSaved] = useState(false);
  const toast = useToast();

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const counts = useMemo(
    () => ({
      valid: value.filter((item) => item.e164 && !item.duplicate).length,
      invalid: value.filter((item) => item.error).length,
      duplicates: value.filter((item) => item.duplicate).length,
    }),
    [value],
  );
  function append(items: { name?: string; phone: string }[]) {
    const seen = new Set(
      value.flatMap((item) => (item.e164 ? [item.e164] : [])),
    );
    onChange([
      ...value,
      ...items.map((item, index) => {
        const checked = normalizeCampaignPhone(item.phone, country),
          duplicate = !!checked.e164 && seen.has(checked.e164);
        if (checked.e164) seen.add(checked.e164);
        return {
          id: `manual-${Date.now()}-${index}`,
          name: (item.name || "").slice(0, 255),
          original: item.phone,
          e164: checked.e164,
          error: checked.reason,
          duplicate,
        };
      }),
    ]);
    setSaved(false);
  }
  function revalidate(items: ManualRecipient[]) {
    const seen = new Set<string>();
    return items.map((item) => {
      const checked = normalizeCampaignPhone(item.original, country),
        duplicate = !!checked.e164 && seen.has(checked.e164);
      if (checked.e164) seen.add(checked.e164);
      return { ...item, e164: checked.e164, error: checked.reason, duplicate };
    });
  }
  function updateRecipient(
    id: string,
    patch: Partial<Pick<ManualRecipient, "name" | "original">>,
  ) {
    onChange(
      revalidate(
        value.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      ),
    );
    setSaved(false);
  }
  async function save() {
    setSaved(false);
    await onSave();
    setSaved(true);
  }
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/60 px-5 py-5 sm:px-6">
        <div className="flex gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-700">
            <UserPlus size={21} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Cadastro Manual
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Ideal para listas pequenas. A validação confirma apenas o formato
              do telefone, não a disponibilidade no WhatsApp.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setBulkOpen((open) => !open)}>
          <ClipboardPaste size={17} />
          {bulkOpen ? "Fechar colagem" : "Colar vários registros"}
        </Button>
      </header>
      <div className="space-y-6 p-5 sm:p-6">
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 lg:grid-cols-[110px_minmax(180px,1fr)_minmax(220px,1.2fr)_auto]">
          <Input
            label="DDI"
            aria-label="Código do país (DDI)"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
          />
          <Input
            label="Nome (opcional)"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome do contato"
          />
          <Input
            label="Telefone WhatsApp"
            aria-describedby="phone-help"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="(11) 95432-5801"
          />
          <Button
            className="self-end"
            disabled={!phone.trim() || !/^\d{1,3}$/.test(country)}
            onClick={() => {
              append([{ name, phone }]);
              setName("");
              setPhone("");
            }}
          >
            <UserPlus size={17} />
            Adicionar contato
          </Button>
          <p id="phone-help" className="text-xs text-slate-500 lg:col-span-4">
            <Phone className="mr-1 inline" size={13} />
            Informe um DDI de 1 a 3 dígitos. Brasil (+55) é o padrão; números
            com “+” preservam o DDI informado.
          </p>
        </div>
        {bulkOpen && (
          <div className="animate-in rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
            <label
              className="text-sm font-semibold text-slate-800"
              htmlFor="bulk-phones"
            >
              Colagem em massa
            </label>
            <p className="mt-1 text-xs text-slate-500">
              Use uma linha por registro: somente telefone ou “Nome; telefone”.
            </p>
            <textarea
              id="bulk-phones"
              className="mt-3 min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              value={bulk}
              onChange={(event) => setBulk(event.target.value)}
              placeholder={"Ana; +55 11 99999-9999\nBruno; +55 21 99999-9999"}
            />
            <div className="mt-3 flex justify-end">
              <Button
                variant="secondary"
                disabled={!bulk.trim()}
                onClick={() => {
                  append(parseBulkPhoneRecords(bulk));
                  setBulk("");
                  setBulkOpen(false);
                }}
              >
                <ClipboardPaste size={16} />
                Adicionar lista
              </Button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Total", value.length, "neutral"],
            ["Válidos", counts.valid, "success"],
            ["Inválidos", counts.invalid, "danger"],
            ["Duplicados", counts.duplicates, "warning"],
          ].map(([label, total, variant]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {label}
              </span>
              <div className="mt-2 flex items-end justify-between">
                <strong className="text-2xl font-semibold tabular-nums text-slate-950">
                  {total}
                </strong>
                <Badge
                  variant={
                    variant as "neutral" | "success" | "danger" | "warning"
                  }
                >
                  {label}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        {value.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm">
              <Users size={22} />
            </span>
            <h3 className="mt-4 font-semibold text-slate-800">
              Nenhum destinatário adicionado
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Use o formulário acima ou cole vários números para começar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Informado</th>
                  <th className="px-4 py-3">Normalizado</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {value.map((item) => (
                  <tr className="transition hover:bg-slate-50/80" key={item.id}>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <Pencil
                          className="absolute left-2.5 top-2.5 text-slate-400"
                          size={14}
                        />
                        <input
                          aria-label="Editar nome"
                          className="w-full max-w-48 rounded-lg border border-transparent bg-transparent py-2 pl-8 pr-2 outline-none transition hover:border-slate-200 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                          value={item.name}
                          onChange={(event) =>
                            updateRecipient(item.id, {
                              name: event.target.value,
                            })
                          }
                          placeholder="Sem nome"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        aria-label={`Editar telefone de ${item.name || item.original}`}
                        className="w-44 rounded-lg border border-transparent bg-transparent px-2 py-2 text-slate-600 outline-none transition hover:border-slate-200 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                        value={item.original}
                        onChange={(event) =>
                          updateRecipient(item.id, {
                            original: event.target.value,
                          })
                        }
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {item.e164 || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge>Manual</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          item.e164 && !item.duplicate
                            ? "success"
                            : item.duplicate
                              ? "warning"
                              : "danger"
                        }
                      >
                        {item.duplicate
                          ? "Duplicado"
                          : item.error || "Formato válido"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Remover ${item.name || item.original}`}
                        onClick={() =>
                          onChange(
                            value.filter((current) => current.id !== item.id),
                          )
                        }
                      >
                        <Trash2 size={15} />
                        Remover
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <div>
            {saved && !busy && (
              <p
                role="status"
                className="flex items-center gap-2 text-sm text-emerald-700"
              >
                <CheckCircle2 size={17} />
                Público manual salvo no rascunho.
              </p>
            )}
            {(counts.invalid > 0 || counts.duplicates > 0) && (
              <p role="alert" className="text-sm text-amber-700">
                Resolva os itens inválidos ou duplicados antes de salvar.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              disabled={!value.length || busy}
              onClick={() => setConfirmClearOpen(true)}
            >
              Limpar lista
            </Button>
            <Button
              loading={busy}
              disabled={
                !counts.valid || !!counts.invalid || !!counts.duplicates
              }
              onClick={() => void save()}
            >
              Salvar público manual
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        title="Limpar lista"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Todos os contatos adicionados manualmente serão removidos.
          </p>

          <p className="text-sm font-medium text-slate-800">
            Esta ação não poderá ser desfeita.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmClearOpen(false)}
            >
              Cancelar
            </Button>

            <Button
              variant="danger"
              onClick={() => {
                onChange([]);
                setSaved(false);
                setConfirmClearOpen(false);

                toast.success(
                  "Lista limpa",
                  "Todos os contatos foram removidos.",
                );
              }}
            >
              Limpar lista
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
