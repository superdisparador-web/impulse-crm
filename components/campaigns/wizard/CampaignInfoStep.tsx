import { FileText, MessageSquareText } from "lucide-react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import CampaignSurface from "@/components/ui/crm/CampaignSurface";
import { CampaignType } from "@/types/campaign";
import { WhatsappAccount } from "@/types/whatsapp";

export interface CampaignInfoValue {
  name: string;
  description: string;
  campaignType: CampaignType;
  whatsappAccountId: string;
  internalNotes: string;
}

const textareaClass = "min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100";

export default function CampaignInfoStep({ value, accounts, onChange }: { value: CampaignInfoValue; accounts: WhatsappAccount[]; onChange: (value: CampaignInfoValue) => void }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700"><MessageSquareText size={20} /></span>
        <div><h2 className="text-xl font-bold tracking-tight text-slate-950">Informações da campanha</h2><p className="mt-1 text-sm leading-6 text-slate-600">Identifique a ação e selecione a conta oficial responsável pelo envio.</p></div>
      </header>
      <CampaignSurface className="grid gap-5 md:grid-cols-2">
        <Input autoFocus required label="Nome da campanha" placeholder="Ex.: Lançamento de agosto" value={value.name} onChange={event => onChange({ ...value, name: event.target.value })} />
        <Select required label="Conta oficial" value={value.whatsappAccountId} onChange={event => onChange({ ...value, whatsappAccountId: event.target.value })} options={[{ value: "", label: "Selecione uma conta" }, ...accounts.map(account => ({ value: account.id, label: `${account.name} · ${account.displayPhoneNumber || account.phoneNumber}` }))]} />
        <Select label="Categoria" value={value.campaignType} onChange={event => onChange({ ...value, campaignType: event.target.value as CampaignType })} options={[{ value: "MARKETING", label: "Marketing" }, { value: "UTILITY", label: "Utilidade" }, { value: "AUTHENTICATION", label: "Autenticação" }]} />
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600"><FileText className="text-slate-400" size={18} /><span>O rascunho é salvo automaticamente durante a edição.</span></div>
        <label className="md:col-span-2"><span className="mb-2 block text-sm font-medium text-slate-700">Descrição</span><textarea className={textareaClass} placeholder="Contexto e objetivo da campanha" value={value.description} onChange={event => onChange({ ...value, description: event.target.value })} /></label>
        <label className="md:col-span-2"><span className="mb-2 block text-sm font-medium text-slate-700">Observações internas</span><textarea className={textareaClass} placeholder="Estas informações não serão enviadas aos destinatários" value={value.internalNotes} onChange={event => onChange({ ...value, internalNotes: event.target.value })} /></label>
      </CampaignSurface>
    </div>
  );
}
