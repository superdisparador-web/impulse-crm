"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { campaignsService } from "@/services/campaigns.service";
import { Campaign, CampaignProgress } from "@/types/campaign";
import { OperationalRecipient } from "@/types/campaign";
import Modal from "@/components/ui/Modal";
import { canCancelCampaign, primaryCampaignAction, shouldPollCampaign } from "../campaign-operational-ui.mjs";

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [progress, setProgress] = useState<CampaignProgress | null>(null);
  const [recipients,setRecipients]=useState<OperationalRecipient[]>([]);
  const [recipientPage,setRecipientPage]=useState(1);
  const [recipientPages,setRecipientPages]=useState(1);
  const [recipientSearch,setRecipientSearch]=useState("");
  const [recipientStatus,setRecipientStatus]=useState("");
  const [modal,setModal]=useState<"start"|"schedule"|"pause"|"cancel"|null>(null);
  const [scheduledAt,setScheduledAt]=useState("");
  const [cancelReason,setCancelReason]=useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await campaignsService.getCampaignById(id);

        if (!active) return;

        setError("");
        setCampaign(data);
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error ? err.message : "Erro ao carregar campanha.",
        );
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(()=>{let active=true;void campaignsService.recipients(id,{page:recipientPage,search:recipientSearch,status:recipientStatus||undefined}).then(result=>{if(active){setRecipients(result.items);setRecipientPages(result.meta.totalPages);}}).catch(error=>{if(active)setError(error instanceof Error?error.message:"Erro ao carregar destinatários.");});return()=>{active=false};},[id,recipientPage,recipientSearch,recipientStatus]);

  const campaignStatus=campaign?.status;
  useEffect(()=>{if(!shouldPollCampaign(campaignStatus,false))return;let busy=false;const refresh=async()=>{if(!shouldPollCampaign(campaignStatus,document.hidden)||busy)return;busy=true;try{const value=await campaignsService.progress(id);setProgress(value);setCampaign(current=>current?{...current,status:value.status}:current);}finally{busy=false;}};void refresh();const timer=setInterval(()=>void refresh(),5000);return()=>clearInterval(timer);},[id,campaignStatus]);

  async function operate(action:"validate"|"start"|"pause"|"resume"){if(actionLoading)return;setActionLoading(true);setError("");try{if(action==="validate"){const result=await campaignsService.validateCampaign(id);if(!result.valid)throw new Error(result.reasons.map(r=>r.message).join("; "));setCampaign(await campaignsService.getCampaignById(id));}else setCampaign(await ({start:campaignsService.startCampaign,pause:campaignsService.pauseCampaign,resume:campaignsService.resumeCampaign}[action]).call(campaignsService,id));}catch(err){setError(err instanceof Error?err.message:"Não foi possível executar a ação.");}finally{setActionLoading(false);}}

  async function cancelCampaign() {
    if (actionLoading) return;

    setActionLoading(true);
    setError("");

    try {
      setCampaign(await campaignsService.cancelCampaign(id,cancelReason));setModal(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao cancelar campanha.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function scheduleCampaign(){if(!scheduledAt)return;setActionLoading(true);try{setCampaign(await campaignsService.scheduleCampaign(id,new Date(scheduledAt).toISOString()));setModal(null);}catch(err){setError(err instanceof Error?err.message:"Erro ao agendar campanha.");}finally{setActionLoading(false);}}

  if (error && !campaign) {
    return (
      <main>
        <div className="rounded border border-red-800 bg-red-950/50 p-3 text-red-200">
          {error}
        </div>
      </main>
    );
  }

  if (!campaign) return <main>Carregando...</main>;

  const metrics = [
    ["Total", progress?.total??campaign.totalContacts],
    ["Na fila", progress?.queued??campaign.totalQueued],
    ["Processando", progress?.processing??0],
    ["Enviadas", progress?.sent??campaign.totalSent],
    ["Entregues", progress?.delivered??campaign.totalDelivered],
    ["Lidas", progress?.read??campaign.totalRead],
    ["Falhas temporárias", progress?.failedRetryable??0],
    ["Falhas permanentes", progress?.failedPermanent??campaign.totalFailed],
    ["Cancelados", progress?.canceled??0],
    ["Desconhecidos", progress?.unknown??0],
    ["Pendentes", progress?.pending??0],
  ] as const;
  const action=primaryCampaignAction(campaign.status) as "validate"|"start"|"pause"|"resume"|null;

  return (
    <main className="space-y-6">
      <div className="flex justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">{campaign.name}</h1>
          <p className="text-slate-400">Status: {campaign.status}</p>
        </div>
        <div className="flex gap-2">
          {action&&<button className="rounded bg-emerald-700 px-4 py-2 disabled:opacity-50" disabled={actionLoading} onClick={()=>action==="validate"||action==="resume"?void operate(action):setModal(action)}>{action==="validate"?"Validar":action==="start"?"Iniciar":action==="pause"?"Pausar":"Retomar"}</button>}
          {campaign.status==="READY"&&<button className="rounded bg-blue-700 px-4 py-2" onClick={()=>setModal("schedule")}>Agendar</button>}
          {campaign.status==="DRAFT"&&<Link
            className="rounded bg-slate-800 px-4 py-2"
            href={`/campaigns/${id}/edit`}
          >
            Editar
          </Link>}
          {canCancelCampaign(campaign.status)&&<button
            className="rounded bg-red-900 px-4 py-2 disabled:opacity-50"
            disabled={actionLoading || ["COMPLETED","COMPLETED_WITH_ERRORS","CANCELED"].includes(campaign.status)}
            onClick={() => setModal("cancel")}
          >
            Cancelar
          </button>}
          {["COMPLETED","COMPLETED_WITH_ERRORS","FAILED"].includes(campaign.status)&&<button className="rounded bg-slate-800 px-4 py-2" onClick={()=>void campaignsService.downloadResults(id)}>Exportar resultados</button>}
        </div>
      </div>

      {progress&&<section className="rounded-xl bg-slate-900 p-4" aria-label="Progresso da campanha"><div className="mb-2 flex justify-between"><strong>Progresso operacional</strong><span>{progress.percentCompleted}%</span></div><div className="h-2 overflow-hidden rounded bg-slate-700"><div className="h-full bg-emerald-500 transition-all" style={{width:`${progress.percentCompleted}%`}} /></div><p className="mt-2 text-sm text-slate-400">{progress.completed} concluídos · {progress.pending} pendentes · {progress.averagePerSecond}/s · previsão {progress.estimatedCompletionAt?new Date(progress.estimatedCompletionAt).toLocaleString():"-"} · atualizado em {new Date(progress.updatedAt).toLocaleString()}</p></section>}

      {error && (
        <div className="rounded border border-red-800 bg-red-950/50 p-3 text-red-200">
          {error}
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-slate-900 p-4">
          <h2 className="font-semibold">Informações gerais</h2>
          <p>{campaign.description || "Sem descrição"}</p>
          <p>Criada por: {campaign.createdBy?.name}</p>
          <p>Criada em: {new Date(campaign.createdAt).toLocaleString()}</p>
          <p>
            Agendada:{" "}
            {campaign.scheduledAt
              ? new Date(campaign.scheduledAt).toLocaleString()
              : "-"}
          </p>
        </div>
        <div className="rounded-xl bg-slate-900 p-4">
          <h2 className="font-semibold">Conta</h2>
          <p>{campaign.whatsappAccount?.name ?? "-"}</p>
          <p>{campaign.whatsappAccount?.phoneNumber ?? ""}</p>
        </div>
        <div className="rounded-xl bg-slate-900 p-4">
          <h2 className="font-semibold">Template</h2>
          <p>{campaign.whatsappTemplate?.name ?? "-"}</p>
          <p>
            {campaign.whatsappTemplate?.category} {campaign.whatsappTemplate?.language}
          </p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-slate-900 p-4">
            <p className="text-slate-400">{label}</p>
            <strong className="text-2xl">{value}</strong>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-3 p-4"><h2 className="mr-auto text-xl font-semibold">Destinatários e erros</h2><input aria-label="Buscar destinatário" className="rounded bg-slate-900 p-2" placeholder="Nome ou telefone" value={recipientSearch} onChange={e=>{setRecipientSearch(e.target.value);setRecipientPage(1)}}/><select aria-label="Filtrar status" className="rounded bg-slate-900 p-2" value={recipientStatus} onChange={e=>{setRecipientStatus(e.target.value);setRecipientPage(1)}}><option value="">Todos os status</option>{["PENDING","QUEUED","PROCESSING","SENT","DELIVERED","READ","FAILED_RETRYABLE","FAILED_PERMANENT","CANCELED","UNKNOWN"].map(status=><option key={status}>{status}</option>)}</select></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {recipients.length ? (
                recipients.map((recipient) => (
                  <tr key={recipient.id} className="border-t border-slate-800">
                    <td className="p-3">{recipient.name}</td>
                    <td>{recipient.phone}</td>
                    <td>{recipient.status}</td>
                    <td>{recipient.assignedUser?.name??"-"}</td><td>{recipient.attemptCount}</td><td>{recipient.sentAt?new Date(recipient.sentAt).toLocaleString():"-"}</td>
                    <td>{recipient.errorMessage ?? "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-4 text-slate-400">Nenhum destinatário.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2 p-4"><button disabled={recipientPage<=1} onClick={()=>setRecipientPage(page=>page-1)}>Anterior</button><span>{recipientPage}/{recipientPages}</span><button disabled={recipientPage>=recipientPages} onClick={()=>setRecipientPage(page=>page+1)}>Próxima</button></div>
      </section>
      <Modal isOpen={modal!==null} title={modal==="schedule"?"Agendar campanha":modal==="cancel"?"Cancelar campanha":modal==="pause"?"Pausar campanha":"Iniciar campanha"} onClose={()=>!actionLoading&&setModal(null)}><div className="space-y-4"><p>{modal==="cancel"?"Os destinatários ainda não processados serão cancelados.":modal==="pause"?"Novos envios serão interrompidos após as chamadas atuais.":modal==="schedule"?"Informe uma data e hora futura.":"Confirme o início dos envios oficiais pela Meta."}</p>{modal==="schedule"&&<input autoFocus aria-label="Data do agendamento" type="datetime-local" className="w-full rounded border p-2 text-slate-900" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)}/>} {modal==="cancel"&&<textarea autoFocus aria-label="Motivo do cancelamento" className="w-full rounded border p-2 text-slate-900" maxLength={500} value={cancelReason} onChange={e=>setCancelReason(e.target.value)} />}<div className="flex justify-end gap-2"><button onClick={()=>setModal(null)}>Voltar</button><button disabled={actionLoading} className="rounded bg-emerald-700 px-4 py-2" onClick={()=>modal==="start"?void operate("start").then(()=>setModal(null)):modal==="pause"?void operate("pause").then(()=>setModal(null)):modal==="schedule"?void scheduleCampaign():void cancelCampaign()}>{actionLoading?"Processando...":"Confirmar"}</button></div></div></Modal>
    </main>
  );
}
