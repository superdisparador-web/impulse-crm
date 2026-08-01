"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { WhatsappAccount } from "@/types/whatsapp";

const mask = (value: string) => value.length < 7 ? "••••" : `${value.slice(0, 3)}••••${value.slice(-3)}`;

type Props = { account: WhatsappAccount | null; saving: boolean; error: string; onClose: () => void; onSubmit: (accessToken: string) => Promise<void> };

export function AccessTokenModal({ account, saving, error, onClose, onSubmit }: Props) {
  const [accessToken, setAccessToken] = useState("");
  const [visible, setVisible] = useState(false);
  function close() { if (saving) return; setAccessToken(""); setVisible(false); onClose(); }
  async function submit(event: FormEvent) { event.preventDefault(); if (saving || !accessToken.trim()) return; await onSubmit(accessToken.trim()); }
  return <Modal isOpen={Boolean(account)} title="Substituir Access Token" onClose={close}>
    {account && <form onSubmit={submit} className="space-y-4">
      <div className="rounded-xl bg-slate-50 p-4 text-sm"><strong className="text-slate-900">{account.name}</strong><p className="mt-1 text-slate-600">{account.displayPhoneNumber || account.phoneNumber || "Número não informado"}</p><p className="mt-2 font-mono text-xs text-slate-500">WABA {mask(account.wabaId)} · Phone ID {mask(account.phoneNumberId)}</p></div>
      <p className="text-sm text-amber-700">O token atual nunca será exibido. O novo token será validado com a Meta e armazenado criptografado.</p>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <label className="block text-sm font-semibold">Novo Access Token<div className="relative mt-1"><Input autoFocus type={visible ? "text" : "password"} autoComplete="new-password" value={accessToken} onChange={event => setAccessToken(event.target.value)} required minLength={20} className="pr-11"/><button type="button" onClick={() => setVisible(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-label={visible ? "Ocultar token" : "Mostrar token"}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>
      <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={close} disabled={saving}>Cancelar</Button><Button type="submit" loading={saving} disabled={!accessToken.trim()}>Validar e atualizar</Button></div>
    </form>}
  </Modal>;
}
