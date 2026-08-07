"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CampaignImport,
  CampaignListSummary,
  DestinationConfiguration,
  RecipientSample,
  VariableMapping,
  campaignsService,
} from "@/services/campaigns.service";
import { templatesService } from "@/services/templates.service";
import { userService } from "@/services/user.service";
import { whatsappService } from "@/services/whatsapp.service";
import {
  CampaignAudienceEstimate,
  CampaignAudienceMaterializationResult,
  CampaignSegmentationFilters,
  CampaignType,
  CampaignValidationIssue,
} from "@/types/campaign";
import WizardProgress from "./WizardProgress";
import SegmentationAudiencePanel from "./SegmentationAudiencePanel";
import ScheduleStep from "./ScheduleStep";
import TemplateStep from "./TemplateStep";
import CampaignDestinationEditor from "./CampaignDestinationEditor";
import CampaignStickyFooter from "./CampaignStickyFooter";
import CampaignReviewPanel from "./CampaignReviewPanel";
import SendTestMessageModal from "./SendTestMessageModal";
import ManualAudiencePanel, { ManualRecipient } from "./ManualAudiencePanel";
import AudienceSourceSelector from "./AudienceSourceSelector";
import CampaignInfoStep from "./CampaignInfoStep";
import { WhatsappTemplate, WhatsappTemplateVariable } from "@/types/templates";
import { User } from "@/types/user";
import { WhatsappAccount } from "@/types/whatsapp";
import {
  campaignContinueReason,
  completedStepTarget,
  previousStep,
} from "./campaign-navigation";
import CampaignSurface from "@/components/ui/crm/CampaignSurface";
import StatusAlert from "@/components/ui/crm/StatusAlert";
import ConfirmationStep from "./ConfirmationStep";

const steps = [
    "Informações da campanha",
    "Público",
    "Template",
    "Destino",
    "Revisão",
    "Agendamento",
    "Confirmação",
  ],
  field =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100";
const mediaHeaders = new Set(["IMAGE", "VIDEO", "DOCUMENT"]);
type ImportState = CampaignImport & {
  columnMapping?: {
    phoneColumn: string;
    nameColumn?: string;
    includedColumns: string[];
    confirmed: boolean;
  };
  validRows?: number;
  invalidRows?: number;
  duplicateRows?: number;
  ddiCorrectedRows?: number;
  missingNameRows?: number;
  status?: string;
};
const keyOf = (v: WhatsappTemplateVariable) =>
  `${v.component}:${v.position}:${v.buttonIndex ?? ""}`;
export default function CampaignWizard() {
  const router = useRouter(),
    titleRef = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(1),
    [campaignId, setCampaignId] = useState<string>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [alerts, setAlerts] = useState<string[]>([]),
    [dirty, setDirty] = useState(false),
    [lastSavedAt, setLastSavedAt] = useState<Date>(),
    [testOpen, setTestOpen] = useState(false);
  const [accounts, setAccounts] = useState<WhatsappAccount[]>([]),
    [templates, setTemplates] = useState<WhatsappTemplate[]>([]),
    [brokers, setBrokers] = useState<User[]>([]),
    [managers, setManagers] = useState<User[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    campaignType: "MARKETING" as CampaignType,
    whatsappAccountId: "",
    internalNotes: "",
  });
  const [imported, setImported] = useState<ImportState>(),
    [phoneColumn, setPhoneColumn] = useState(""),
    [nameColumn, setNameColumn] = useState(""),
    [included, setIncluded] = useState<string[]>([]),
    [listConfirmed, setListConfirmed] = useState(false),
    [summary, setSummary] = useState<CampaignListSummary>();
  const [sampleKind, setSampleKind] = useState<
      "valid" | "invalid" | "duplicates"
    >("valid"),
    [sample, setSample] = useState<RecipientSample>(),
    [sampleIndex, setSampleIndex] = useState(0),
    [templateId, setTemplateId] = useState(""),
    [mappings, setMappings] = useState<VariableMapping[]>([]),
    [mediaName, setMediaName] = useState("");
  const [destination, setDestination] = useState<DestinationConfiguration>({
      mode: "FIXED_URL",
      fixedUrl: "",
      queue: "oficial",
      speed: 60,
      concurrency: 5,
      automaticDistribution: false,
    }),
    [reviewed, setReviewed] = useState(false),
    [audienceMode, setAudienceMode] = useState<"CSV" | "SEGMENT" | "MANUAL">(
      "CSV",
    ),
    [manualRecipients, setManualRecipients] = useState<ManualRecipient[]>([]),
    [segmentationFilters, setSegmentationFilters] =
      useState<CampaignSegmentationFilters>({}),
    [audienceEstimate, setAudienceEstimate] =
      useState<CampaignAudienceEstimate>(),
    [materialization, setMaterialization] =
      useState<CampaignAudienceMaterializationResult>(),
    [validationIssues, setValidationIssues] = useState<
      CampaignValidationIssue[]
    >([]),
    [estimated, setEstimated] = useState(0),
    [dragging, setDragging] = useState(false),
    [sendMode, setSendMode] = useState<"NOW" | "LATER">("NOW"),
    [scheduledAt, setScheduledAt] = useState(""),
    [timezone, setTimezone] = useState("America/Sao_Paulo"),
    [completed, setCompleted] = useState(false);
  const selectedTemplate = templates.find((t) => t.id === templateId),
    previewRow = sample?.items[sampleIndex],
    previewData =
      previewRow?.originalData || imported?.sample?.[sampleIndex] || {};
  async function restore(id: string) {
    setBusy(true);
    try {
      const c = await campaignsService.getCampaignById(id),
        imp = c.import as ImportState | undefined;
      setCampaignId(id);
      setStep(Math.min(Math.max(c.currentStep || 1, 1), 7));
      setForm({
        name: c.name,
        description: c.description || "",
        campaignType: c.category || c.campaignType,
        whatsappAccountId: c.whatsappAccountId || "",
        internalNotes: c.internalNotes || "",
      });
      setImported(imp);
      if (imp) {
        const m = imp.columnMapping;
        setPhoneColumn(m?.phoneColumn || "");
        setNameColumn(m?.nameColumn || "");
        setIncluded(m?.includedColumns || []);
        setListConfirmed(Boolean(c.listConfirmedAt));
        setSummary({
          status: imp.status || "UPLOADED",
          total: imp.totalRows,
          valid: imp.validRows || 0,
          invalid: imp.invalidRows || 0,
          duplicate: imp.duplicateRows || 0,
          ddiCorrected: imp.ddiCorrectedRows || 0,
          withoutName: imp.missingNameRows || 0,
          ready: imp.validRows || 0,
        });
      }
      setTemplateId(c.whatsappTemplateId || "");
      setMappings((c.variableMappings || []) as VariableMapping[]);
      setMediaName(c.mediaOriginalName || "");
      setDestination(
        (c.destinationConfig || {
          mode: "FIXED_URL",
          fixedUrl: "",
        }) as DestinationConfiguration,
      );
      const savedDestination = (c.destinationConfig || {}) as {
        audienceMode?: string;
        audienceFilters?: CampaignSegmentationFilters;
      };
      if (savedDestination.audienceMode === "MANUAL") {
        setAudienceMode("MANUAL");
        const manual = await campaignsService.getManualRecipients(id);
        setManualRecipients(
          manual.items.map((x) => ({
            id: x.id,
            name: x.name || "",
            original: x.phoneOriginal || x.e164,
            e164: x.e164,
          })),
        );
        setListConfirmed(manual.items.length > 0);
        setSummary({
          status: "READY",
          total: manual.items.length,
          valid: manual.items.length,
          invalid: 0,
          duplicate: 0,
          ddiCorrected: 0,
          withoutName: manual.items.filter((x) => !x.name).length,
          ready: manual.items.length,
        });
        setSample({
          items: manual.items.map((x, index) => ({
            id: x.id,
            originalRowNumber: index + 1,
            originalData: { source: "MANUAL" },
            phoneOriginal: x.phoneOriginal || x.e164,
            phone: x.e164,
            name: x.name || undefined,
            status: "PENDING",
          })),
          meta: {
            page: 1,
            limit: 500,
            total: manual.items.length,
            totalPages: 1,
          },
        });
      }
      if (savedDestination.audienceMode === "SEGMENTATION") {
        setAudienceMode("SEGMENT");
        setSegmentationFilters(savedDestination.audienceFilters || {});
        setMaterialization({
          totalEncontrado: c.totalContacts || 0,
          totalElegivel: c.totalContacts || 0,
          totalMaterializado: c.totalContacts || 0,
          duplicadosRemovidos: 0,
          invalidosRemovidos: 0,
          semTelefone: 0,
          filtrosAplicados: savedDestination.audienceFilters || {},
        });
      }
      setReviewed(Boolean(c.reviewedAt));
      const warnings = [];
      if (!c.whatsappAccount || c.whatsappAccount.status !== "ACTIVE")
        warnings.push("A conta selecionada não está mais disponível.");
      if (c.whatsappTemplateId && c.whatsappTemplate?.status !== "APPROVED")
        warnings.push(
          "O template selecionado não está mais disponível para envio.",
        );
      setAlerts(warnings);
    } catch {
      setError("Não foi possível reabrir este rascunho.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    titleRef.current?.focus();
    const draft =
      new URLSearchParams(location.search).get("draft") || undefined;
    Promise.all([
      whatsappService.getAccounts({
        status: "ACTIVE",
        state: "active",
        pageSize: 100,
      }),
      userService.getAll({ active: true, limit: 100 }),
    ]).then(([a, u]) => {
      setAccounts(
        a.items.filter(
          (x) =>
            x.provider === "META_CLOUD" && x.tokenConfigured && !x.deletedAt,
        ),
      );
      setBrokers(
        u.items.filter(
          (x) =>
            x.active && !x.deletedAt && ["CORRETOR", "BROKER"].includes(x.role),
        ),
      );
      setManagers(
        u.items.filter(
          (x) =>
            x.active && !x.deletedAt && ["MANAGER", "GERENTE"].includes(x.role),
        ),
      );
    });
    if (draft) void Promise.resolve().then(() => restore(draft));
  }, []);
  useEffect(() => {
    if (!form.whatsappAccountId) return;
    void templatesService
      .getTemplates({
        whatsappAccountId: form.whatsappAccountId,
        category: form.campaignType,
        status: "APPROVED",
        state: "active",
        pageSize: 100,
      })
      .then((r) => setTemplates(r.items));
  }, [form.whatsappAccountId, form.campaignType]);
  useEffect(() => {
    if (campaignId && summary)
      void campaignsService
        .recipientSample(campaignId, sampleKind)
        .then((r) => {
          setSample(r);
          setSampleIndex(0);
        });
  }, [campaignId, summary, sampleKind]);
  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    addEventListener("beforeunload", leave);
    return () => removeEventListener("beforeunload", leave);
  }, [dirty]);
  useEffect(() => {
    if (!dirty || !campaignId) return;
    const timer = window.setTimeout(() => {
      void campaignsService
        .updateCampaign(campaignId, form)
        .then(() => campaignsService.saveStep(campaignId, Math.min(step, 7)))
        .then(() => {
          setDirty(false);
          setLastSavedAt(new Date());
        })
        .catch(() => setError("Não foi possível salvar automaticamente."));
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [dirty, campaignId, form, step]);
  async function ensureDraft() {
    if (campaignId) return campaignId;
    const c = await campaignsService.createCampaign(form);
    setCampaignId(c.id);
    return c.id;
  }
  async function saveDraft() {
    setBusy(true);
    try {
      const id = await ensureDraft();
      await campaignsService.updateCampaign(id, form);
      await campaignsService.saveStep(id, step);
      setDirty(false);
      setLastSavedAt(new Date());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível salvar o rascunho.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function uploadList(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const id = await ensureDraft(),
        r = await campaignsService.uploadList(id, file);
      setImported(r);
      setIncluded(r.headers.map((h) => h.id));
      setPhoneColumn(
        r.phoneCandidates.length === 1 ? r.phoneCandidates[0] : "",
      );
      setNameColumn(r.nameCandidates.length === 1 ? r.nameCandidates[0] : "");
      setSummary(undefined);
      setListConfirmed(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Selecione um CSV válido.");
    } finally {
      setBusy(false);
    }
  }
  async function analyze() {
    if (!campaignId) return;
    setBusy(true);
    try {
      setSummary(
        await campaignsService.analyzeList(campaignId, {
          phoneColumn,
          nameColumn: nameColumn || undefined,
          includedColumns: included,
          confirmed: listConfirmed,
        }),
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível higienizar a lista.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function estimateSegment() {
    setBusy(true);
    setError("");
    try {
      const id = await ensureDraft();
      const value = await campaignsService.estimateAudience(
        id,
        segmentationFilters,
        {
          speed: destination.speed || 60,
          concurrency: destination.concurrency || 5,
          category: form.campaignType,
        },
      );
      setAudienceEstimate(value);
      setEstimated(value.totalElegivel);
      setMaterialization(undefined);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível estimar o público.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function materializeSegment() {
    setBusy(true);
    setError("");
    try {
      const id = await ensureDraft();
      const value = await campaignsService.materializeAudience(
        id,
        segmentationFilters,
      );
      setMaterialization(value);
      setEstimated(value.totalElegivel);
      setListConfirmed(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível confirmar o público.",
      );
    } finally {
      setBusy(false);
    }
  }
  function chooseTemplate(id: string) {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    setMappings(
      (t?.variables || []).map((v) => ({
        component: v.component,
        position: v.position,
        buttonIndex: v.buttonIndex,
        sourceType:
          v.component === "BODY" && v.position === 1 && nameColumn
            ? "COLUMN"
            : "FIXED",
        sourceColumn:
          v.component === "BODY" && v.position === 1
            ? nameColumn || undefined
            : undefined,
        fixedValue: "",
      })),
    );
    setMediaName("");
  }
  function patchMapping(
    variable: WhatsappTemplateVariable,
    patch: Partial<VariableMapping>,
  ) {
    setMappings((ms) =>
      ms.map((m) =>
        keyOf(variable) ===
        `${m.component}:${m.position}:${m.buttonIndex ?? ""}`
          ? { ...m, ...patch }
          : m,
      ),
    );
    setDirty(true);
  }
  function mappingValid() {
    return (
      Boolean(selectedTemplate) &&
      selectedTemplate!.variables.every((v) => {
        const m = mappings.find(
          (x) =>
            `${x.component}:${x.position}:${x.buttonIndex ?? ""}` === keyOf(v),
        );
        return (
          m &&
          (m.sourceType !== "FIXED" || Boolean(m.fixedValue?.trim())) &&
          (m.sourceType !== "COLUMN" ||
            Boolean(m.sourceColumn && included.includes(m.sourceColumn))) &&
          (v.component !== "BUTTON" || m.buttonIndex !== undefined)
        );
      })
    );
  }
  async function saveTemplate() {
    if (!campaignId || !mappingValid())
      throw new Error("Configure todas as variáveis obrigatórias.");
    await campaignsService.configureTemplate(campaignId, {
      whatsappTemplateId: templateId,
      variableMappings: mappings,
    });
  }
  async function uploadMedia(file?: File) {
    if (!file || !campaignId) return;
    setBusy(true);
    try {
      await saveTemplate();
      const c = await campaignsService.uploadMedia(campaignId, file);
      setMediaName(c.fileName || file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mídia incompatível.");
    } finally {
      setBusy(false);
    }
  }
  async function next() {
    setError("");
    try {
      if (step === 1) {
        if (!form.name.trim() || !form.whatsappAccountId)
          throw new Error(
            "Preencha o nome e selecione uma conta oficial ativa.",
          );
        await saveDraft();
      } else if (step === 2) {
        if (
          (audienceMode === "CSV" && (!summary?.valid || !listConfirmed)) ||
          (audienceMode === "SEGMENT" &&
            !materialization?.totalMaterializado) ||
          (audienceMode === "MANUAL" && (!summary?.valid || !listConfirmed))
        )
          throw new Error("Higienize e confirme a lista.");
        if (audienceMode === "SEGMENT" && !materialization?.totalMaterializado)
          throw new Error("Calcule e confirme o público segmentado.");
      } else if (step === 3) {
        await saveTemplate();
        if (mediaHeaders.has(selectedTemplate?.headerType || "") && !mediaName)
          throw new Error(
            `O template exige mídia ${selectedTemplate?.headerType}.`,
          );
      } else if (step === 4) {
        if (!campaignId) throw new Error("Salve o rascunho.");
        await campaignsService.configureDestination(campaignId, destination);
      } else if (step === 5) {
        if (!reviewed || !campaignId)
          throw new Error("Confirme a revisão antes de continuar.");
        await campaignsService.review(campaignId, true);
      }
      await campaignsService.saveStep(
        campaignId || (await ensureDraft()),
        Math.min(step + 1, 7),
      );
      setStep((s) => s + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Há campos incompletos.");
    }
  }
  async function saveManualAudience() {
    const id = campaignId || (await ensureDraft());
    setBusy(true);
    try {
      const result = await campaignsService.saveManualRecipients(
        id,
        manualRecipients
          .filter((x) => x.e164 && !x.duplicate)
          .map((x) => ({ name: x.name, phone: x.e164! })),
      );
      setSummary({
        status: "READY",
        total: result.valid,
        valid: result.valid,
        invalid: 0,
        duplicate: 0,
        ddiCorrected: 0,
        withoutName: manualRecipients.filter((x) => !x.name).length,
        ready: result.valid,
      });
      setListConfirmed(true);
      setDirty(false);
      setLastSavedAt(new Date());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Falha ao salvar público manual.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function finish() {
    if (!campaignId || !reviewed) return;
    setBusy(true);
    try {
      await campaignsService.configureDestination(campaignId, {
        ...destination,
        timezone,
      });
      const validation = await campaignsService.validateCampaign(campaignId);
      setValidationIssues(validation.reasons);
      if (!validation.valid)
        throw new Error(validation.reasons.map((r) => r.message).join("; "));
      if (sendMode === "LATER") {
        if (!scheduledAt) throw new Error("Informe uma data futura.");
        await campaignsService.scheduleCampaign(
          campaignId,
          new Date(scheduledAt).toISOString(),
        );
      } else await campaignsService.startCampaign(campaignId);
      setCompleted(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "O rascunho possui pendências.",
      );
    } finally {
      setBusy(false);
    }
  }
  function continueReason() {
    return campaignContinueReason({
      step,
      audienceMode,
      audienceValid: !!summary?.valid,
      listConfirmed,
      segmentMaterialized: !!materialization?.totalMaterializado,
      templateAvailable: !!selectedTemplate?.availableForSending,
      mappingsValid: mappingValid(),
      destinationConfigured: !!destination.mode,
      reviewed,
    });
  }
  function close() {
    if (
      !dirty ||
      confirm("Existem alterações não salvas. Deseja fechar mesmo assim?")
    )
      router.push("/campaigns");
  }
  return (
    <main className="mx-auto max-w-7xl space-y-6 pb-36 text-slate-900">
      <span className="sr-only">
        Informações básicas · Lista de contatos · Template e configurações ·
        SALVAR CAMPANHA COMO RASCUNHO
      </span>
      <header>
        <h1
          ref={titleRef}
          tabIndex={-1}
          className="text-3xl font-bold tracking-tight text-slate-950 outline-none"
        >
          {campaignId ? "Editar campanha" : "Nova campanha"}
        </h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Rascunho salvo automaticamente · Preparação oficial · Nenhuma mensagem
          será enviada sem confirmação.
        </p>
      </header>
      <WizardProgress
        steps={steps}
        current={step}
        issues={validationIssues}
        onStep={(target) =>
          setStep((current) => completedStepTarget(current, target))
        }
      />
      <div className="space-y-3" aria-live="polite">
        {alerts.map((a) => (
          <StatusAlert key={a} tone="warning" title="Atenção ao rascunho">
            {a}
          </StatusAlert>
        ))}
        {error && (
          <StatusAlert tone="error" title="Não foi possível continuar">
            {error}
          </StatusAlert>
        )}
      </div>
      <CampaignSurface className="min-h-[500px]" padding="default">
        {step === 1 && (
          <CampaignInfoStep
            value={form}
            accounts={accounts}
            onChange={(value) => {
              setForm(value);
              setDirty(true);
            }}
          />
        )}
        {step === 2 && (
          <div className="space-y-5">
            <AudienceSourceSelector
              value={audienceMode}
              onChange={(value) => setAudienceMode(value)}
            />
            {audienceMode === "MANUAL" ? (
              <ManualAudiencePanel
                value={manualRecipients}
                onChange={(value) => {
                  setManualRecipients(value);
                  setDirty(true);
                }}
                busy={busy}
                onSave={() => void saveManualAudience()}
              />
            ) : audienceMode === "SEGMENT" ? (
              <SegmentationAudiencePanel
                filters={segmentationFilters}
                onChange={(filters) => {
                  setSegmentationFilters(filters);
                  setAudienceEstimate(undefined);
                  setMaterialization(undefined);
                }}
                estimate={audienceEstimate}
                onEstimate={() => void estimateSegment()}
                onConfirm={() => void materializeSegment()}
                busy={busy}
                managers={managers}
                brokers={brokers}
              />
            ) : (
              <div className="space-y-5">
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    void uploadList(e.dataTransfer.files[0]);
                  }}
                  className={`block rounded-2xl border-2 border-dashed p-8 text-center transition ${dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50"}`}
                >
                  <strong>Arraste e solte seu CSV aqui</strong>
                  <span className="mt-1 block text-sm text-slate-500">
                    ou clique para selecionar · até 10 MB
                  </span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    onChange={(e) => void uploadList(e.target.files?.[0])}
                  />
                </label>
                {imported && (
                  <>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label>
                        Coluna de telefone *
                        <select
                          className={field}
                          value={phoneColumn}
                          onChange={(e) => setPhoneColumn(e.target.value)}
                        >
                          <option value="">Selecione</option>
                          {imported.headers.map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Coluna de nome
                        <select
                          className={field}
                          value={nameColumn}
                          onChange={(e) => setNameColumn(e.target.value)}
                        >
                          <option value="">Nenhuma</option>
                          {imported.headers.map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <fieldset>
                      <legend>Colunas mantidas</legend>
                      {imported.headers.map((h) => (
                        <label className="mr-4" key={h.id}>
                          <input
                            type="checkbox"
                            checked={included.includes(h.id)}
                            onChange={(e) =>
                              setIncluded(
                                e.target.checked
                                  ? [...included, h.id]
                                  : included.filter((x) => x !== h.id),
                              )
                            }
                          />{" "}
                          {h.name}
                        </label>
                      ))}
                    </fieldset>
                    <label className="flex gap-2">
                      <input
                        type="checkbox"
                        checked={listConfirmed}
                        onChange={(e) => setListConfirmed(e.target.checked)}
                      />
                      Confirmo que os números válidos e higienizados serão
                      utilizados nesta campanha. Duplicados e inválidos não
                      serão enviados.
                    </label>
                    <button
                      disabled={!phoneColumn || !listConfirmed || busy}
                      className="rounded bg-blue-600 px-4 py-2 disabled:opacity-40"
                      onClick={() => void analyze()}
                    >
                      Higienizar lista
                    </button>
                  </>
                )}
                {summary && (
                  <>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
                      {[
                        ["Total", summary.total],
                        ["Válidos", summary.valid],
                        ["Inválidos", summary.invalid],
                        ["Duplicados", summary.duplicate],
                        ["DDI corrigido", summary.ddiCorrected],
                        ["Prontos", summary.ready],
                      ].map(([k, v]) => (
                        <div
                          className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                          key={String(k)}
                        >
                          <small>{k}</small>
                          <strong className="block text-xl">{v}</strong>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <select
                        className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700"
                        value={sampleKind}
                        onChange={(e) =>
                          setSampleKind(e.target.value as typeof sampleKind)
                        }
                      >
                        <option value="valid">Amostra válida</option>
                        <option value="invalid">Inválidos</option>
                        <option value="duplicates">Duplicados</option>
                      </select>
                      {(["invalid", "duplicates", "clean"] as const).map(
                        (k) => (
                          <button
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-700 transition hover:bg-slate-50"
                            key={k}
                            onClick={() =>
                              void campaignsService.downloadList(campaignId!, k)
                            }
                          >
                            Baixar {k}
                          </button>
                        ),
                      )}
                    </div>
                    <div className="overflow-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            <th>Linha</th>
                            <th>Nome</th>
                            <th>Original</th>
                            <th>Normalizado</th>
                            <th>Motivo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sample?.items.map((x) => (
                            <tr key={x.id}>
                              <td>{x.originalRowNumber}</td>
                              <td>{x.name || "-"}</td>
                              <td>{x.phoneOriginal}</td>
                              <td>{x.phone}</td>
                              <td>{x.invalidReason || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        {step === 3 && (
          <TemplateStep
            templates={templates}
            selectedId={templateId}
            onSelect={chooseTemplate}
            mappings={mappings}
            onMapping={patchMapping}
            columns={(imported?.headers || []).filter((header) =>
              included.includes(header.id),
            )}
            recipient={{
              row: previewData,
              phone: previewRow?.phone || "",
              name: previewRow?.name || "",
            }}
            mediaName={mediaName}
            onMedia={(file) => void uploadMedia(file)}
            accountName={
              accounts.find((account) => account.id === form.whatsappAccountId)
                ?.name || "Conta oficial"
            }
            onSendTest={() => setTestOpen(true)}
          />
        )}
        {step === 4 && (
          <CampaignDestinationEditor
            value={destination}
            onChange={setDestination}
            brokers={brokers}
          />
        )}
        {step === 5 && (
          <CampaignReviewPanel
            campaign={{
              name: form.name,
              description: form.description,
              category: form.campaignType,
            }}
            accountName={
              accounts.find((a) => a.id === form.whatsappAccountId)?.name || ""
            }
            audienceMode={audienceMode}
            summary={summary}
            template={selectedTemplate}
            mappings={mappings}
            destination={destination}
            sendMode={sendMode}
            scheduledAt={scheduledAt}
            timezone={timezone}
            issues={validationIssues}
            row={previewData}
            phone={previewRow?.phone || ""}
            name={previewRow?.name || ""}
            mediaName={mediaName}
            onSendTest={() => setTestOpen(true)}
            reviewed={reviewed}
            onReviewed={setReviewed}
          />
        )}
        {step === 6 && (
          <ScheduleStep
            mode={sendMode}
            onMode={setSendMode}
            scheduledAt={scheduledAt}
            onScheduledAt={setScheduledAt}
            timezone={timezone}
            onTimezone={setTimezone}
          />
        )}
        {step === 7 && (
          <ConfirmationStep
            completed={completed}
            sendMode={sendMode}
            scheduledAt={scheduledAt}
            timezone={timezone}
            recipients={summary?.ready || estimated}
            accountName={
              accounts.find((a) => a.id === form.whatsappAccountId)?.name
            }
            templateName={selectedTemplate?.displayName}
            onOpenCampaign={() => router.push(`/campaigns/${campaignId}`)}
          />
        )}
      </CampaignSurface>
      <SendTestMessageModal
        open={testOpen}
        onClose={() => setTestOpen(false)}
        template={selectedTemplate}
        mappings={mappings}
        accountName={
          accounts.find((a) => a.id === form.whatsappAccountId)?.name ||
          "Conta oficial"
        }
        onSend={async (phone, values) => {
          if (!campaignId) throw new Error("Salve o rascunho antes do teste.");
          await campaignsService.sendTestMessage(campaignId, {
            phone,
            values,
            idempotencyKey: crypto.randomUUID(),
          });
        }}
      />
      <CampaignStickyFooter
        state={busy ? "saving" : error ? "error" : dirty ? "dirty" : "saved"}
        lastSavedAt={lastSavedAt}
        step={step}
        busy={busy}
        continueReason={continueReason()}
        onClose={close}
        onSave={() => void saveDraft()}
        onBack={() => setStep(previousStep)}
        onContinue={() => void (step < 7 ? next() : finish())}
        finalLabel={
          step === 7
            ? sendMode === "NOW"
              ? "Confirmar e iniciar envio"
              : "Confirmar e agendar campanha"
            : undefined
        }
      />
    </main>
  );
}
