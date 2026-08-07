"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ManualAudiencePanel, {
  type ManualRecipient,
} from "@/components/campaigns/wizard/ManualAudiencePanel";

import {
  CheckCircle2,
  Clock3,
  Database,
  Megaphone,
  MessageSquareText,
  Save,
  Send,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/crm";
import { whatsappService } from "@/services/whatsapp.service";
import { templatesService } from "@/services/templates.service";
import { campaignsService } from "@/services/campaigns.service";
import { userService } from "@/services/user.service";
import type { User } from "@/types/user";
import type { WhatsappAccount } from "@/types/whatsapp";
import type { WhatsappTemplate } from "@/types/templates";

type ContactSource = "CSV" | "MANUAL" | "CRM" | "REUSE";
type DistributionMode = "ROUND_ROBIN" | "KEEP_OWNER" | "NONE";
type SendMode = "NOW" | "LATER";

const fieldClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

const contactOptions: Array<{
  id: ContactSource;
  title: string;
  description: string;
  icon: typeof Upload;
}> = [
  {
    id: "CSV",
    title: "Importar arquivo",
    description: "CSV ou planilha com seus contatos.",
    icon: Upload,
  },
  {
    id: "MANUAL",
    title: "Inserir manualmente",
    description: "Digite ou cole nomes e telefones.",
    icon: UserPlus,
  },
  {
    id: "CRM",
    title: "Selecionar do CRM",
    description: "Use leads que já estão cadastrados.",
    icon: Database,
  },
  {
    id: "REUSE",
    title: "Reutilizar uma base",
    description: "Aproveite contatos de outra campanha.",
    icon: CheckCircle2,
  },
];

function SectionHeader({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-sm font-bold text-white">
        {number}
      </span>

      <div>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export default function CampaignBuilder() {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [templateId, setTemplateId] = useState("");

  const [accounts, setAccounts] = useState<WhatsappAccount[]>([]);
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [dataError, setDataError] = useState("");

  const [contactSource, setContactSource] = useState<ContactSource>("CSV");

  const [distributionMode, setDistributionMode] =
    useState<DistributionMode>("ROUND_ROBIN");

  const [sendMode, setSendMode] = useState<SendMode>("NOW");

  const [scheduledAt, setScheduledAt] = useState("");
  const [dailyLimit, setDailyLimit] = useState("100");
  const [brokers, setBrokers] = useState<User[]>([]);
  const [selectedBrokerIds, setSelectedBrokerIds] = useState<string[]>([]);
  const [loadingBrokers, setLoadingBrokers] = useState(false);
  const [brokersError, setBrokersError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingError, setSavingError] = useState("");

  const [campaignId, setCampaignId] = useState("");

  const [manualRecipients, setManualRecipients] = useState<ManualRecipient[]>(
    [],
  );

  const [savingManualRecipients, setSavingManualRecipients] = useState(false);

  const [headerImageUrl, setHeaderImageUrl] = useState("");
  const [headerImageFile, setHeaderImageFile] = useState<File | null>(null);
  const [headerMediaId, setHeaderMediaId] = useState("");
  const [uploadingHeaderMedia, setUploadingHeaderMedia] = useState(false);

  /* =========================
   IMPORTAÇÃO DE ARQUIVOS
========================= */

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [uploadingFile, setUploadingFile] = useState(false);

  const [importResult, setImportResult] = useState<any>(null);

  const [phoneColumn, setPhoneColumn] = useState("");

  const [nameColumn, setNameColumn] = useState("");

  const [analyzingFile, setAnalyzingFile] = useState(false);

  const [audienceSummary, setAudienceSummary] = useState<any>(null);

  const selectedAccount = accounts.find((account) => account.id === accountId);

  const selectedTemplate = templates.find(
    (template) => template.id === templateId,
  );

  const components = Array.isArray(selectedTemplate?.components)
    ? (selectedTemplate.components as any[])
    : [];

  const header = components.find((c) => c.type === "HEADER");
  const body = components.find((c) => c.type === "BODY");
  const footer = components.find((c) => c.type === "FOOTER");
  const buttons = components.find((c) => c.type === "BUTTONS");

  useEffect(() => {
    let active = true;

    async function loadAccounts() {
      setLoadingAccounts(true);
      setDataError("");

      try {
        const response = await whatsappService.getAccounts({
          status: "ACTIVE",
          state: "active",
          pageSize: 100,
        });

        if (!active) return;

        const availableAccounts = response.items.filter(
          (account) => account.status === "ACTIVE" && !account.deletedAt,
        );

        setAccounts(availableAccounts);

        if (availableAccounts.length === 1) {
          setAccountId(availableAccounts[0].id);
        }
      } catch (error) {
        if (!active) return;

        setDataError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as contas oficiais.",
        );
      } finally {
        if (active) {
          setLoadingAccounts(false);
        }
      }
    }

    void loadAccounts();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    setTemplateId("");
    setTemplates([]);

    if (!accountId) {
      return () => {
        active = false;
      };
    }

    async function loadTemplates() {
      setLoadingTemplates(true);
      setDataError("");

      try {
        const response = await templatesService.getTemplates({
          whatsappAccountId: accountId,
          status: "APPROVED",
          state: "active",
          pageSize: 100,
        });

        if (!active) return;

        setTemplates(response.items);

        if (response.items.length === 1) {
          setTemplateId(response.items[0].id);
        }
      } catch (error) {
        if (!active) return;

        setDataError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os templates aprovados.",
        );
      } finally {
        if (active) {
          setLoadingTemplates(false);
        }
      }
    }

    void loadTemplates();

    return () => {
      active = false;
    };
  }, [accountId]);
  useEffect(() => {
    let active = true;

    async function loadBrokers() {
      if (distributionMode !== "ROUND_ROBIN") {
        return;
      }

      try {
        setLoadingBrokers(true);
        setBrokersError("");

        const [corretoresResponse, brokersResponse] = await Promise.all([
          userService.getAll({
            active: true,
            role: "CORRETOR",
            limit: 100,
          }),
          userService.getAll({
            active: true,
            role: "BROKER",
            limit: 100,
          }),
        ]);

        if (!active) return;

        const uniqueBrokers = [
          ...corretoresResponse.items,
          ...brokersResponse.items,
        ].filter(
          (user, index, items) =>
            items.findIndex((item) => item.id === user.id) === index,
        );

        setBrokers(uniqueBrokers);

        setSelectedBrokerIds((current) =>
          current.length
            ? current.filter((id) =>
                uniqueBrokers.some((broker) => broker.id === id),
              )
            : uniqueBrokers.map((broker) => broker.id),
        );
      } catch (error) {
        if (!active) return;

        setBrokersError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os corretores.",
        );
      } finally {
        if (active) {
          setLoadingBrokers(false);
        }
      }
    }

    void loadBrokers();

    return () => {
      active = false;
    };
  }, [distributionMode]);
  const readyToSave = name.trim().length > 0;

  const readyToSend = useMemo(
    () =>
      Boolean(
        name.trim() &&
        accountId &&
        templateId &&
        (sendMode === "NOW" || scheduledAt),
      ),
    [name, accountId, templateId, sendMode, scheduledAt],
  );

  async function ensureDraft() {
    if (campaignId) {
      return campaignId;
    }

    if (!name.trim()) {
      throw new Error("Informe o nome da campanha.");
    }

    const campaign = await campaignsService.createCampaign({
      name: name.trim(),
      campaignType: "UTILITY",
      whatsappAccountId: accountId || undefined,
      whatsappTemplateId: templateId || undefined,
      scheduledAt: sendMode === "LATER" ? scheduledAt || undefined : undefined,
    });

    setCampaignId(campaign.id);

    return campaign.id;
  }

  /* ============================================================
   IMPORTAÇÃO DE CSV / XLSX
============================================================ */

  async function handleUpload(file: File) {
    try {
      setUploadingFile(true);
      setSavingError("");

      const id = await ensureDraft();

      const result = await campaignsService.uploadList(id, file);

      setSelectedFile(file);
      setImportResult(result);

      setPhoneColumn(result.phoneCandidates?.[0] ?? result.headers?.[0] ?? "");

      setNameColumn(result.nameCandidates?.[0] ?? result.headers?.[1] ?? "");

      toast.success(
        "Arquivo importado",
        `${result.totalRows ?? 0} registros encontrados.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao importar arquivo.";

      setSavingError(message);

      toast.error("Erro na importação", message);
    } finally {
      setUploadingFile(false);
    }
  }

  async function analyzeImportedList() {
    if (!campaignId || !importResult || !phoneColumn) {
      toast.warning(
        "Mapeamento incompleto",
        "Selecione pelo menos a coluna de telefone.",
      );
      return;
    }

    try {
      setAnalyzingFile(true);
      setSavingError("");

      const summary = await campaignsService.analyzeList(campaignId, {
        phoneColumn,
        nameColumn: nameColumn || undefined,
        includedColumns: importResult.headers.map(
          (column: { id: string }) => column.id,
        ),
        confirmed: true,
      });

      setAudienceSummary(summary);

      toast.success(
        "Lista analisada",
        `${summary.ready} contato(s) estão prontos para envio.`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível analisar a lista.";

      setSavingError(message);
      toast.error("Erro ao analisar lista", message);
    } finally {
      setAnalyzingFile(false);
    }
  }

  async function saveDraft() {
    if (!readyToSave || saving) return;

    try {
      setSaving(true);
      setSavingError("");

      await ensureDraft();

      toast.success(
        "Campanha salva",
        `A campanha "${name.trim()}" foi salva com sucesso.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao salvar campanha.";

      setSavingError(message);
      toast.error("Erro ao salvar campanha", message);
    } finally {
      setSaving(false);
    }
  }

  async function saveManualAudience() {
    const validRecipients = manualRecipients.filter(
      (recipient) => recipient.e164 && !recipient.duplicate && !recipient.error,
    );

    if (!validRecipients.length) {
      toast.warning(
        "Nenhum contato válido",
        "Adicione pelo menos um contato válido antes de salvar.",
      );
      return;
    }

    try {
      setSavingManualRecipients(true);
      setSavingError("");

      const id = await ensureDraft();

      const result = await campaignsService.saveManualRecipients(
        id,
        validRecipients.map((recipient) => ({
          name: recipient.name,
          phone: recipient.e164!,
        })),
      );

      toast.success(
        "Contatos salvos",
        `${result.valid} contato(s) foram adicionados à campanha.`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível salvar os contatos.";

      setSavingError(message);
      toast.error("Erro ao salvar contatos", message);
    } finally {
      setSavingManualRecipients(false);
    }
    function toggleBroker(brokerId: string) {
      setSelectedBrokerIds((current) =>
        current.includes(brokerId)
          ? current.filter((id) => id !== brokerId)
          : [...current, brokerId],
      );
    }

    function selectAllBrokers() {
      setSelectedBrokerIds(brokers.map((broker) => broker.id));
    }

    function clearSelectedBrokers() {
      setSelectedBrokerIds([]);
    }
  }
  function toggleBroker(brokerId: string) {
    setSelectedBrokerIds((current) =>
      current.includes(brokerId)
        ? current.filter((id) => id !== brokerId)
        : [...current, brokerId],
    );
  }

  function selectAllBrokers() {
    setSelectedBrokerIds(brokers.map((broker) => broker.id));
  }

  function clearSelectedBrokers() {
    setSelectedBrokerIds([]);
  }

  const manualReadyContacts = manualRecipients.filter(
    (recipient) => recipient.e164 && !recipient.duplicate && !recipient.error,
  ).length;

  const readyContacts =
    contactSource === "CSV"
      ? (audienceSummary?.ready ?? 0)
      : manualReadyContacts;

  const cleanupStats = [
    [
      "Importados",
      contactSource === "CSV"
        ? (audienceSummary?.total ?? 0)
        : manualRecipients.length,
    ],
    [
      "Duplicados",
      contactSource === "CSV"
        ? (audienceSummary?.duplicate ?? 0)
        : manualRecipients.filter((recipient) => recipient.duplicate).length,
    ],
    [
      "Inválidos",
      contactSource === "CSV"
        ? (audienceSummary?.invalid ?? 0)
        : manualRecipients.filter((recipient) => recipient.error).length,
    ],
    ["Prontos", readyContacts],
  ] as const;

  return (
    <main className="mx-auto max-w-7xl space-y-6 pb-28 text-slate-900">
      <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-100">
              <Megaphone size={15} />
              Campanha simples
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Nova campanha
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              Configure o WhatsApp, os contatos, o atendimento e o envio em uma
              única tela.
            </p>
          </div>

          <a
            href="/campaigns/legacy"
            className="text-sm font-semibold text-blue-100 transition hover:text-white"
          >
            Abrir modo avançado
          </a>
        </div>
      </header>

      {savingError && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {savingError}
        </div>
      )}

      {dataError && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {dataError}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              number={1}
              title="Campanha e mensagem"
              description="Escolha o nome, a conta oficial e o template aprovado."
            />

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700 lg:col-span-2">
                Nome da campanha
                <input
                  className={fieldClass}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex.: Feirão Meu Primeiro Apê"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Conta oficial
                <select
                  className={fieldClass}
                  value={accountId}
                  disabled={loadingAccounts}
                  onChange={(event) => setAccountId(event.target.value)}
                >
                  <option value="">
                    {loadingAccounts
                      ? "Carregando contas..."
                      : "Selecione uma conta"}
                  </option>

                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.verifiedName ||
                        account.name ||
                        account.displayPhoneNumber ||
                        account.phoneNumber ||
                        "WhatsApp Oficial"}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Template aprovado
                <select
                  className={fieldClass}
                  value={templateId}
                  disabled={!accountId || loadingTemplates}
                  onChange={(event) => setTemplateId(event.target.value)}
                >
                  <option value="">
                    {!accountId
                      ? "Escolha primeiro a conta oficial"
                      : loadingTemplates
                        ? "Carregando templates..."
                        : templates.length === 0
                          ? "Nenhum template aprovado encontrado"
                          : "Selecione um template"}
                  </option>

                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.displayName || template.name} ·{" "}
                      {template.language}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <MessageSquareText size={17} />
                Prévia da mensagem
              </div>

              {selectedTemplate ? (
                <div className="mt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-slate-900">
                      {selectedTemplate.displayName || selectedTemplate.name}
                    </strong>

                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700">
                      Aprovado
                    </span>

                    <span className="rounded-full bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600">
                      {selectedTemplate.language}
                    </span>
                  </div>
                  {header?.format === "IMAGE" && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-800">
                          Imagem do cabeçalho
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          Selecione a imagem que será enviada junto com este
                          template.
                        </span>

                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          className="mt-3 block w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-semibold file:text-white"
                          onChange={(event) => {
                            const file = event.target.files?.[0] ?? null;

                            setHeaderMediaId("");
                            setHeaderImageFile(file);

                            setHeaderImageUrl((currentUrl) => {
                              if (currentUrl.startsWith("blob:")) {
                                URL.revokeObjectURL(currentUrl);
                              }

                              return file ? URL.createObjectURL(file) : "";
                            });
                          }}
                        />
                      </label>
                    </div>
                  )}
                  <div className="mt-4 flex justify-center rounded-xl bg-slate-100 p-5 sm:p-7">
                    <div className="relative h-[620px] w-[310px] shrink-0 overflow-hidden rounded-[42px] border-[8px] border-slate-950 bg-slate-950 shadow-xl">
                      {/* Recorte superior do celular */}
                      <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-950" />

                      <div className="flex h-full flex-col overflow-hidden rounded-[33px] bg-[#efeae2]">
                        {/* Barra superior do WhatsApp */}
                        <div className="shrink-0 bg-[#f7f8fa] px-3 pb-2 pt-8">
                          <div className="flex items-center gap-2">
                            <span className="text-xl text-blue-500">‹</span>

                            <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-300 text-[10px] font-bold text-slate-700">
                              {selectedAccount?.name
                                ?.slice(0, 2)
                                .toUpperCase() || "WA"}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-slate-900">
                                {selectedAccount?.verifiedName ||
                                  selectedAccount?.name ||
                                  "WhatsApp"}
                              </p>
                              <p className="text-[9px] text-slate-500">
                                online
                              </p>
                            </div>

                            <span className="text-sm text-slate-500">•••</span>
                          </div>
                        </div>

                        {/* Área rolável da conversa */}
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#efeae2] px-3 py-4">
                          <div className="ml-auto w-[94%] overflow-hidden rounded-xl rounded-tr-sm bg-[#d9fdd3] shadow-sm">
                            {header?.format === "IMAGE" &&
                              (headerImageUrl ? (
                                <img
                                  src={headerImageUrl}
                                  alt="Prévia da imagem do cabeçalho"
                                  className="aspect-[4/3] w-full object-cover"
                                />
                              ) : (
                                <div className="flex aspect-[4/3] items-center justify-center bg-slate-200 px-3 text-center text-xs text-slate-500">
                                  Selecione a imagem do cabeçalho
                                </div>
                              ))}

                            {header?.format === "TEXT" && (
                              <div className="px-3 pt-3 text-xs font-semibold text-slate-900">
                                {header.text}
                              </div>
                            )}

                            <div className="whitespace-pre-wrap px-3 pb-2 pt-3 text-[12px] leading-5 text-slate-900">
                              {(body?.text || selectedTemplate.body)
                                ?.replace(/\{\{1\}\}/g, "Pedro")
                                ?.replace(/\{\{2\}\}/g, "Apartamento")}
                            </div>

                            {footer?.text && (
                              <div className="px-3 pb-2 text-[9px] text-slate-500">
                                {footer.text}
                              </div>
                            )}

                            <div className="flex justify-end px-3 pb-2 text-[8px] text-slate-500">
                              10:42 ✓✓
                            </div>

                            {Array.isArray(buttons?.buttons) &&
                              buttons.buttons.length > 0 && (
                                <div className="border-t border-emerald-200 bg-[#d9fdd3]">
                                  {buttons.buttons.map(
                                    (
                                      button: { text?: string },
                                      index: number,
                                    ) => (
                                      <button
                                        key={`${button.text || "botao"}-${index}`}
                                        type="button"
                                        className="w-full border-b border-emerald-200 px-2 py-2.5 text-[11px] font-semibold text-[#027eb5] last:border-b-0"
                                      >
                                        {button.text || "Botão"}
                                      </button>
                                    ),
                                  )}
                                </div>
                              )}
                          </div>
                        </div>

                        {/* Campo inferior fixo */}
                        <div className="shrink-0 bg-[#f7f8fa] px-2 py-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg text-blue-500">＋</span>

                            <div className="flex h-8 flex-1 items-center rounded-full bg-white px-3 text-[10px] text-slate-400">
                              Mensagem
                            </div>

                            <span className="text-sm">📷</span>
                            <span className="text-sm">🎤</span>
                          </div>

                          <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-slate-900" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Escolha uma conta e um template aprovado para visualizar a
                  mensagem.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              number={2}
              title="Contatos"
              description="Escolha a forma mais rápida de adicionar o público."
            />

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {contactOptions.map((option) => {
                const Icon = option.icon;
                const active = contactSource === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setContactSource(option.id)}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-blue-500 bg-blue-50 ring-4 ring-blue-100"
                        : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                        active
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon size={19} />
                    </span>

                    <span>
                      <strong className="block text-sm text-slate-900">
                        {option.title}
                      </strong>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        {option.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              {contactSource === "CSV" && (
                <>
                  <input
                    id="campaign-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];

                      if (file) {
                        void handleUpload(file);
                      }
                    }}
                  />

                  <label
                    htmlFor="campaign-upload"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-8 py-12 transition hover:border-blue-500 hover:bg-blue-50"
                  >
                    <Upload size={42} className="text-blue-600" />

                    <strong className="mt-4 text-lg text-slate-900">
                      Importar arquivo
                    </strong>

                    <span className="mt-2 text-sm text-slate-500">
                      Clique aqui ou selecione um CSV / Excel
                    </span>

                    <span className="mt-2 text-xs text-slate-400">
                      CSV • XLS • XLSX
                    </span>
                  </label>

                  {selectedFile && (
                    <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <strong className="block text-slate-900">
                            {selectedFile.name}
                          </strong>

                          <span className="text-sm text-slate-500">
                            {importResult?.totalRows ?? 0} registros encontrados
                          </span>
                        </div>

                        <Button
                          onClick={() => void analyzeImportedList()}
                          disabled={analyzingFile}
                        >
                          {analyzingFile ? "Analisando..." : "Analisar Lista"}
                        </Button>
                      </div>

                      {importResult?.headers?.length > 0 && (
                        <div className="mt-6 grid gap-4 lg:grid-cols-2">
                          <label className="text-sm font-semibold text-slate-700">
                            Coluna Nome
                            <select
                              className={fieldClass}
                              value={nameColumn}
                              onChange={(event) =>
                                setNameColumn(event.target.value)
                              }
                            >
                              <option value="">Não utilizar nome</option>

                              {importResult.headers.map(
                                (column: {
                                  id: string;
                                  name: string;
                                  index: number;
                                }) => (
                                  <option key={column.id} value={column.id}>
                                    {column.name}
                                  </option>
                                ),
                              )}
                            </select>
                          </label>

                          <label className="text-sm font-semibold text-slate-700">
                            Coluna Telefone
                            <select
                              className={fieldClass}
                              value={phoneColumn}
                              onChange={(event) =>
                                setPhoneColumn(event.target.value)
                              }
                            >
                              <option value="">
                                Selecione a coluna de telefone
                              </option>

                              {importResult.headers.map(
                                (column: {
                                  id: string;
                                  name: string;
                                  index: number;
                                }) => (
                                  <option key={column.id} value={column.id}>
                                    {column.name}
                                  </option>
                                ),
                              )}
                            </select>
                          </label>
                        </div>
                      )}

                      {audienceSummary && (
                        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                          <div className="rounded-xl border bg-white p-4">
                            <span className="text-xs text-slate-500">
                              Importados
                            </span>

                            <strong className="mt-1 block text-2xl">
                              {audienceSummary.total}
                            </strong>
                          </div>

                          <div className="rounded-xl border bg-white p-4">
                            <span className="text-xs text-slate-500">
                              Válidos
                            </span>

                            <strong className="mt-1 block text-2xl text-green-600">
                              {audienceSummary.valid}
                            </strong>
                          </div>

                          <div className="rounded-xl border bg-white p-4">
                            <span className="text-xs text-slate-500">
                              Duplicados
                            </span>

                            <strong className="mt-1 block text-2xl text-amber-600">
                              {audienceSummary.duplicate}
                            </strong>
                          </div>

                          <div className="rounded-xl border bg-white p-4">
                            <span className="text-xs text-slate-500">
                              Inválidos
                            </span>

                            <strong className="mt-1 block text-2xl text-red-600">
                              {audienceSummary.invalid}
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {contactSource === "MANUAL" && (
                <ManualAudiencePanel
                  value={manualRecipients}
                  onChange={setManualRecipients}
                  busy={savingManualRecipients}
                  onSave={() => void saveManualAudience()}
                />
              )}

              {contactSource === "CRM" && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <strong>Integração com CRM (próxima etapa)</strong>
                </div>
              )}

              {contactSource === "REUSE" && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <strong>Reutilizar base (próxima etapa)</strong>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              number={3}
              title="Limpeza da base"
              description="O Impulse prepara automaticamente os números antes do envio."
            />

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Remover números duplicados",
                "Corrigir DDI e formatação",
                "Remover números inválidos",
                "Separar números sem DDD",
                "Remover contatos bloqueados",
                "Remover quem respondeu SAIR",
              ].map((item) => (
                <label
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700"
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {item}
                </label>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {cleanupStats.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <span className="text-xs font-medium text-slate-500">
                    {label}
                  </span>

                  <strong className="mt-1 block text-2xl text-slate-950">
                    {value}
                  </strong>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              number={4}
              title="Atendimento"
              description="Defina quem receberá os clientes que responderem."
            />

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["ROUND_ROBIN", "Rodízio automático"],
                ["KEEP_OWNER", "Manter corretor atual"],
                ["NONE", "Não distribuir"],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm font-semibold transition ${
                    distributionMode === value
                      ? "border-blue-500 bg-blue-50 text-blue-800"
                      : "border-slate-200 text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="distribution"
                    value={value}
                    checked={distributionMode === value}
                    onChange={() =>
                      setDistributionMode(value as DistributionMode)
                    }
                  />
                  {label}
                </label>
              ))}
            </div>

            {distributionMode === "ROUND_ROBIN" && (
              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_260px]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={17} className="text-blue-600" />

                      <strong className="text-sm text-slate-900">
                        Corretores participantes
                      </strong>
                    </div>

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      {selectedBrokerIds.length} selecionados
                    </span>
                  </div>

                  {loadingBrokers ? (
                    <p className="mt-4 text-sm text-slate-500">
                      Carregando corretores...
                    </p>
                  ) : brokersError ? (
                    <p className="mt-4 text-sm text-red-600">{brokersError}</p>
                  ) : (
                    <>
                      <div className="mt-4 flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={selectAllBrokers}
                        >
                          Selecionar todos
                        </Button>

                        <Button
                          type="button"
                          variant="secondary"
                          onClick={clearSelectedBrokers}
                        >
                          Limpar
                        </Button>
                      </div>

                      <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
                        {brokers.map((broker) => (
                          <label
                            key={broker.id}
                            className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-blue-300"
                          >
                            <input
                              type="checkbox"
                              checked={selectedBrokerIds.includes(broker.id)}
                              onChange={() => toggleBroker(broker.id)}
                            />

                            <div>
                              <strong className="block text-sm text-slate-900">
                                {broker.name}
                              </strong>

                              <span className="text-xs text-slate-500">
                                {broker.email}
                              </span>
                            </div>
                          </label>
                        ))}

                        {!brokers.length && (
                          <p className="text-sm text-slate-500">
                            Nenhum corretor encontrado.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <label className="text-sm font-semibold text-slate-700">
                  Limite diário por corretor
                  <input
                    type="number"
                    min="1"
                    className={fieldClass}
                    value={dailyLimit}
                    onChange={(event) => setDailyLimit(event.target.value)}
                  />
                </label>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              number={5}
              title="Envio"
              description="Envie imediatamente ou programe uma data."
            />

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSendMode("NOW")}
                className={`rounded-2xl border p-4 text-left transition ${
                  sendMode === "NOW"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200"
                }`}
              >
                <Send size={20} className="text-blue-600" />
                <strong className="mt-3 block text-sm text-slate-900">
                  Enviar agora
                </strong>
                <span className="mt-1 block text-xs text-slate-500">
                  Iniciar após a validação.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSendMode("LATER")}
                className={`rounded-2xl border p-4 text-left transition ${
                  sendMode === "LATER"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200"
                }`}
              >
                <Clock3 size={20} className="text-blue-600" />
                <strong className="mt-3 block text-sm text-slate-900">
                  Agendar
                </strong>
                <span className="mt-1 block text-xs text-slate-500">
                  Escolher data e horário.
                </span>
              </button>
            </div>

            {sendMode === "LATER" && (
              <label className="mt-5 block text-sm font-semibold text-slate-700">
                Data e horário
                <input
                  type="datetime-local"
                  className={fieldClass}
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                />
              </label>
            )}
          </section>
        </div>

        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">
          <h2 className="text-lg font-bold text-slate-950">
            Resumo da campanha
          </h2>

          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-slate-500">Campanha</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {name || "Não informada"}
              </dd>
            </div>

            <div>
              <dt className="text-slate-500">Conta oficial</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {selectedAccount?.verifiedName ||
                  selectedAccount?.name ||
                  selectedAccount?.displayPhoneNumber ||
                  "Não selecionada"}
              </dd>
            </div>

            <div>
              <dt className="text-slate-500">Template</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {selectedTemplate?.displayName ||
                  selectedTemplate?.name ||
                  "Não selecionado"}
              </dd>
            </div>

            <div>
              <dt className="text-slate-500">Contatos prontos</dt>
              <dd className="mt-1 text-2xl font-bold text-slate-950">
                {readyContacts}
              </dd>
            </div>

            <div>
              <dt className="text-slate-500">Atendimento</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {distributionMode === "ROUND_ROBIN" && "Rodízio automático"}
                {distributionMode === "KEEP_OWNER" && "Manter corretor atual"}
                {distributionMode === "NONE" && "Sem distribuição"}
              </dd>
            </div>

            <div>
              <dt className="text-slate-500">Início</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {sendMode === "NOW"
                  ? "Após a confirmação"
                  : scheduledAt || "Data não informada"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 space-y-2">
            <Button
              variant="secondary"
              className="w-full"
              onClick={saveDraft}
              disabled={!readyToSave || saving}
            >
              <Save size={17} />
              {saving ? "Salvando..." : "Salvar rascunho"}
            </Button>

            <Button
              className="w-full"
              disabled={!readyToSend || uploadingHeaderMedia || saving}
              onClick={async () => {
                try {
                  if (!campaignId) {
                    toast.warning(
                      "Campanha não salva",
                      "Salve o rascunho antes de iniciar a campanha.",
                    );
                    return;
                  }

                  if (!headerImageFile && !headerMediaId) {
                    toast.warning(
                      "Imagem obrigatória",
                      "Selecione a imagem do cabeçalho antes de iniciar.",
                    );
                    return;
                  }

                  let mediaId = headerMediaId;

                  if (!mediaId && headerImageFile) {
                    setUploadingHeaderMedia(true);

                    const uploadedMedia = await campaignsService.uploadMedia(
                      campaignId,
                      headerImageFile,
                    );

                    mediaId = uploadedMedia.mediaId;
                    setHeaderMediaId(mediaId);
                  }

                  if (!mediaId) {
                    throw new Error(
                      "A Meta não retornou o Media ID da imagem.",
                    );
                  }

                  const result = await campaignsService.startCampaign(
                    campaignId,
                    {
                      headerMediaId: mediaId,
                    },
                  );

                  toast.success(
                    "Campanha iniciada",
                    `${result.queued} mensagem(ns) foram adicionadas à fila.`,
                  );
                } catch (error) {
                  const message =
                    error instanceof Error
                      ? error.message
                      : "Não foi possível iniciar a campanha.";

                  console.error(error);
                  toast.error("Erro ao iniciar campanha", message);
                } finally {
                  setUploadingHeaderMedia(false);
                }
              }}
            >
              <Send size={17} />
              {uploadingHeaderMedia
                ? "Enviando imagem..."
                : sendMode === "NOW"
                  ? "Iniciar campanha"
                  : "Agendar campanha"}
            </Button>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-400">
            Esta primeira entrega cria a nova experiência visual. As ações serão
            conectadas gradualmente às APIs já existentes.
          </p>
        </aside>
      </div>
    </main>
  );
}
