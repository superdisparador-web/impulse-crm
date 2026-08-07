"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  Bell,
  Building2,
  Cable,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Database,
  Fingerprint,
  HardDrive,
  History,
  KeyRound,
  Laptop,
  Gauge,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MessageCircle,
  MonitorCheck,
  Palette,
  Save,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import Select from "@/components/ui/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { settingsService } from "@/services/settings.service";
import type {
  AuditEntry,
  IntegrationStatus,
  OrganizationSettings,
  PermissionMatrix,
  SettingsMe,
  SettingsSection,
} from "@/types/settings";

type Icon = ComponentType<{ className?: string }>;
type NavItem = {
  id: SettingsSection;
  label: string;
  description: string;
  icon: Icon;
};

const NAV: NavItem[] = [
  {
    id: "account",
    label: "Minha conta",
    description: "Dados pessoais e preferências",
    icon: CircleUserRound,
  },
  {
    id: "organization",
    label: "Empresa",
    description: "Dados e configurações gerais",
    icon: Building2,
  },
  {
    id: "users",
    label: "Usuários e equipes",
    description: "Colaboradores e responsáveis",
    icon: Users,
  },
  {
    id: "roles",
    label: "Permissões de acesso",
    description: "Quem pode acessar cada área",
    icon: KeyRound,
  },
  {
    id: "security",
    label: "Segurança",
    description: "Proteção da sua conta",
    icon: LockKeyhole,
  },
  {
    id: "notifications",
    label: "Notificações",
    description: "Alertas que você recebe",
    icon: Bell,
  },
  {
    id: "branding",
    label: "Aparência",
    description: "Identidade e preferências visuais",
    icon: Palette,
  },
  {
    id: "operations",
    label: "Atendimento",
    description: "Horários, limites e regras de distribuição dos contatos",
    icon: Gauge,
  },
  {
    id: "integrations",
    label: "Integrações",
    description: "Serviços conectados",
    icon: Cable,
  },
  {
    id: "audit",
    label: "Histórico",
    description: "Alterações importantes",
    icon: History,
  },
  {
    id: "system",
    label: "Sistema",
    description: "Informações da plataforma",
    icon: MonitorCheck,
  },
];

const ROLE_LABEL: Record<string, string> = {
  GLOBAL_ADMIN: "Administrador geral",
  ORG_ADMIN: "Superintendente",
  MANAGER: "Gerente",
  BROKER: "Corretor",
};
const CUSTOM_ROLE_LABEL = "Perfil personalizado";
const CUSTOM_PERMISSION = {
  title: "Permissão personalizada",
  description: "Acesso adicional configurado especialmente para este perfil.",
};
const CUSTOM_NOTIFICATION = {
  title: "Notificação personalizada",
  description: "Aviso adicional configurado especialmente para sua conta.",
};

const PERMISSIONS: Record<string, { title: string; description: string }> = {
  "organizations:create": {
    title: "Criar empresas",
    description: "Permite cadastrar novas empresas na plataforma.",
  },
  "organizations:read": {
    title: "Ver empresas",
    description: "Permite consultar empresas e seus dados cadastrais.",
  },
  "organizations:update": {
    title: "Editar empresas",
    description: "Permite atualizar os dados cadastrais das empresas.",
  },
  "organizations:suspend": {
    title: "Suspender empresas",
    description: "Permite interromper temporariamente o acesso de uma empresa.",
  },
  "organizations:archive": {
    title: "Arquivar empresas",
    description: "Permite retirar empresas inativas da operação.",
  },
  "users:create": {
    title: "Criar usuários",
    description: "Permite cadastrar novos usuários na empresa.",
  },
  "users:read": {
    title: "Ver usuários",
    description: "Permite consultar usuários e seus dados.",
  },
  "users:update": {
    title: "Editar usuários",
    description: "Permite atualizar os dados dos usuários.",
  },
  "users:activate": {
    title: "Ativar usuários",
    description: "Permite liberar o acesso de usuários à plataforma.",
  },
  "users:deactivate": {
    title: "Desativar usuários",
    description: "Permite interromper o acesso de usuários à plataforma.",
  },
  "users:archive": {
    title: "Arquivar usuários",
    description: "Permite retirar usuários inativos da operação.",
  },
  "users:reset-password": {
    title: "Redefinir senhas de usuários",
    description: "Permite iniciar a redefinição da senha de outros usuários.",
  },
  "roles:read": {
    title: "Ver perfis de acesso",
    description: "Permite consultar os perfis de acesso disponíveis.",
  },
  "roles:manage": {
    title: "Gerenciar perfis de acesso",
    description: "Permite criar e alterar perfis de acesso.",
  },
  "auth:session:read": {
    title: "Ver sessões de acesso",
    description: "Permite consultar as sessões ativas da própria conta.",
  },
  "auth:password:change": {
    title: "Alterar a própria senha",
    description: "Permite trocar a senha usada para acessar a plataforma.",
  },
  "leads:create": {
    title: "Criar contatos",
    description: "Permite cadastrar novos contatos comerciais.",
  },
  "leads:read": {
    title: "Ver contatos",
    description: "Permite consultar os contatos sob sua responsabilidade.",
  },
  "leads:read-all": {
    title: "Ver todos os contatos",
    description: "Permite consultar os contatos de toda a equipe.",
  },
  "leads:update": {
    title: "Editar contatos",
    description: "Permite atualizar informações e o andamento dos contatos.",
  },
  "leads:assign": {
    title: "Atribuir contatos",
    description: "Permite encaminhar contatos para integrantes da equipe.",
  },
  "leads:unassign": {
    title: "Remover atribuição de contatos",
    description: "Permite retirar o responsável atual de um contato.",
  },
  "leads:archive": {
    title: "Arquivar contatos",
    description: "Permite retirar contatos inativos da operação.",
  },
  "leads:restore": {
    title: "Restaurar contatos",
    description: "Permite recuperar contatos arquivados.",
  },
  "leads:manage-duplicates": {
    title: "Gerenciar contatos duplicados",
    description: "Permite identificar e tratar cadastros repetidos.",
  },
  "leads:history:read": {
    title: "Ver histórico dos contatos",
    description:
      "Permite consultar as alterações e interações de cada contato.",
  },
  "whatsapp:accounts:create": {
    title: "Conectar contas do WhatsApp",
    description: "Permite adicionar novas contas do WhatsApp.",
  },
  "whatsapp:accounts:read": {
    title: "Ver contas do WhatsApp",
    description: "Permite consultar as contas do WhatsApp conectadas.",
  },
  "whatsapp:accounts:update": {
    title: "Editar contas do WhatsApp",
    description: "Permite atualizar as configurações das contas do WhatsApp.",
  },
  "whatsapp:accounts:archive": {
    title: "Arquivar contas do WhatsApp",
    description: "Permite remover contas do WhatsApp da operação.",
  },
  "whatsapp:accounts:test": {
    title: "Testar contas do WhatsApp",
    description: "Permite verificar a conexão das contas do WhatsApp.",
  },
  "whatsapp:conversations:read": {
    title: "Ver conversas do WhatsApp",
    description: "Permite consultar as conversas sob sua responsabilidade.",
  },
  "whatsapp:conversations:read-all": {
    title: "Ver todas as conversas do WhatsApp",
    description: "Permite consultar as conversas de toda a equipe.",
  },
  "whatsapp:conversations:update": {
    title: "Atualizar conversas do WhatsApp",
    description: "Permite alterar o andamento das conversas.",
  },
  "whatsapp:conversations:assign": {
    title: "Atribuir conversas do WhatsApp",
    description: "Permite encaminhar conversas para integrantes da equipe.",
  },
  "whatsapp:messages:read": {
    title: "Ver mensagens do WhatsApp",
    description: "Permite ler mensagens das conversas autorizadas.",
  },
  "whatsapp:messages:send": {
    title: "Enviar mensagens pelo WhatsApp",
    description: "Permite responder contatos pelo WhatsApp.",
  },
  "whatsapp:templates:read": {
    title: "Ver modelos de mensagem",
    description: "Permite consultar os modelos de mensagem do WhatsApp.",
  },
  "whatsapp:templates:create": {
    title: "Criar modelos de mensagem",
    description: "Permite criar modelos de mensagem para o WhatsApp.",
  },
  "whatsapp:templates:update": {
    title: "Editar modelos de mensagem",
    description: "Permite atualizar modelos de mensagem do WhatsApp.",
  },
  "whatsapp:templates:sync": {
    title: "Sincronizar modelos de mensagem",
    description: "Permite atualizar os modelos com os dados do WhatsApp.",
  },
  "whatsapp:templates:manage": {
    title: "Gerenciar modelos de mensagem",
    description: "Permite administrar os modelos de mensagem do WhatsApp.",
  },
  "campaigns:read": {
    title: "Ver campanhas",
    description: "Permite consultar campanhas e seus resultados.",
  },
  "campaigns:create": {
    title: "Criar campanhas",
    description: "Permite configurar novas campanhas.",
  },
  "campaigns:update": {
    title: "Editar campanhas",
    description: "Permite atualizar campanhas em preparação.",
  },
  "campaigns:archive": {
    title: "Arquivar campanhas",
    description: "Permite retirar campanhas inativas da operação.",
  },
  "campaigns:cancel": {
    title: "Cancelar campanhas",
    description:
      "Permite interromper campanhas que ainda podem ser canceladas.",
  },
  "analytics.dashboard.read": {
    title: "Ver painel de resultados",
    description: "Permite acompanhar os principais indicadores da operação.",
  },
  "analytics.campaign.read": {
    title: "Ver resultados de campanhas",
    description: "Permite acompanhar indicadores das campanhas.",
  },
  "analytics.broker.read": {
    title: "Ver resultados dos corretores",
    description: "Permite acompanhar indicadores dos corretores.",
  },
  "analytics.manager.read": {
    title: "Ver resultados dos gerentes",
    description: "Permite acompanhar indicadores dos gerentes.",
  },
  "analytics.whatsapp.read": {
    title: "Ver resultados do WhatsApp",
    description: "Permite acompanhar indicadores de atendimento no WhatsApp.",
  },
  "analytics.event.create": {
    title: "Registrar eventos de análise",
    description: "Permite registrar atividades usadas nos indicadores.",
  },
  "analytics.rollup.manage": {
    title: "Processar indicadores analíticos",
    description: "Permite administrar a consolidação técnica dos indicadores.",
  },
  "distribution.list.create": {
    title: "Criar listas de distribuição",
    description:
      "Permite criar listas para organizar a distribuição de contatos.",
  },
  "distribution.list.read": {
    title: "Ver listas de distribuição",
    description: "Permite consultar listas e seus integrantes.",
  },
  "distribution.list.update": {
    title: "Editar listas de distribuição",
    description: "Permite atualizar listas de distribuição.",
  },
  "distribution.list.delete": {
    title: "Excluir listas de distribuição",
    description: "Permite retirar listas de distribuição da operação.",
  },
  "distribution.list.import": {
    title: "Importar listas de distribuição",
    description: "Permite adicionar integrantes por meio de importação.",
  },
  "distribution.member.manage": {
    title: "Gerenciar integrantes das listas",
    description: "Permite adicionar ou remover integrantes das listas.",
  },
  "distribution.assignment.read": {
    title: "Ver distribuições de contatos",
    description: "Permite consultar como os contatos foram distribuídos.",
  },
  "distribution.assignment.retry": {
    title: "Refazer distribuições de contatos",
    description:
      "Permite tentar novamente distribuições que não foram concluídas.",
  },
  "distribution.report.export": {
    title: "Exportar relatórios de distribuição",
    description: "Permite exportar os resultados das distribuições.",
  },
  "settings:self:read": {
    title: "Ver informações da própria conta",
    description: "Permite consultar seus dados pessoais e preferências.",
  },
  "settings:self:update": {
    title: "Editar informações da própria conta",
    description: "Permite atualizar nome, telefone e preferências pessoais.",
  },
  "settings:organization:read": {
    title: "Ver informações da empresa",
    description: "Permite consultar os dados e as preferências da empresa.",
  },
  "settings:organization:update": {
    title: "Editar informações da empresa",
    description: "Permite alterar dados e configurações gerais da empresa.",
  },
  "settings:users:manage": {
    title: "Gerenciar usuários",
    description: "Permite criar, editar e organizar os usuários da empresa.",
  },
  "settings:teams:manage": {
    title: "Gerenciar equipes",
    description: "Permite criar equipes e alterar seus integrantes.",
  },
  "settings:roles:read": {
    title: "Ver permissões de acesso",
    description: "Permite consultar o que cada perfil pode acessar.",
  },
  "settings:roles:manage": {
    title: "Gerenciar permissões",
    description: "Permite definir o acesso de cada perfil às áreas do sistema.",
  },
  "settings:security:self": {
    title: "Alterar a própria senha",
    description: "Permite atualizar os dados de segurança da própria conta.",
  },
  "settings:security:organization": {
    title: "Proteger contas da empresa",
    description: "Permite definir medidas de segurança para a empresa.",
  },
  "settings:security:global": {
    title: "Administrar a segurança da plataforma",
    description: "Permite definir medidas de proteção para toda a plataforma.",
  },
  "settings:notifications:self": {
    title: "Escolher as próprias notificações",
    description: "Permite escolher quais alertas deseja receber.",
  },
  "settings:notifications:organization": {
    title: "Configurar alertas da empresa",
    description: "Permite definir avisos importantes para a empresa.",
  },
  "settings:branding:read": {
    title: "Ver aparência da empresa",
    description:
      "Permite consultar a identidade visual utilizada na plataforma.",
  },
  "settings:branding:update": {
    title: "Personalizar a aparência",
    description: "Permite alterar cores, imagens e textos da empresa.",
  },
  "settings:operations:read": {
    title: "Ver preferências de atendimento",
    description: "Permite consultar horários e regras de atendimento.",
  },
  "settings:operations:update": {
    title: "Configurar o atendimento",
    description: "Permite alterar horários e preferências de distribuição.",
  },
  "settings:integrations:read": {
    title: "Ver serviços conectados",
    description: "Permite consultar as integrações disponíveis.",
  },
  "settings:integrations:manage": {
    title: "Administrar integrações",
    description: "Permite conectar e gerenciar serviços externos.",
  },
  "settings:audit:self": {
    title: "Ver o próprio histórico",
    description: "Permite consultar as alterações realizadas por você.",
  },
  "settings:audit:team": {
    title: "Ver o histórico da equipe",
    description: "Permite acompanhar alterações realizadas pela equipe.",
  },
  "settings:audit:organization": {
    title: "Ver o histórico da empresa",
    description: "Permite acompanhar alterações realizadas na empresa.",
  },
  "settings:audit:global": {
    title: "Ver todo o histórico",
    description:
      "Permite acompanhar alterações importantes de toda a plataforma.",
  },
  "settings:system:read": {
    title: "Ver informações do sistema",
    description: "Permite consultar o estado geral da plataforma.",
  },
  "settings:system:update": {
    title: "Alterar configurações do sistema",
    description: "Permite atualizar preferências gerais da plataforma.",
  },
};

const NOTIFICATIONS = [
  {
    group: "Conta",
    icon: CircleUserRound,
    items: [
      {
        key: "notifyInApp",
        title: "Receber notificações pelo aplicativo",
        description: "Mostra seus avisos dentro do Impulse CRM.",
      },
      {
        key: "notifyEmail",
        title: "Receber notificações por e-mail",
        description: "Envia os principais avisos para o seu e-mail.",
      },
    ],
  },
  {
    group: "WhatsApp",
    icon: MessageCircle,
    items: [
      {
        key: "notifyWhatsapp",
        title: "Receber mensagens no WhatsApp",
        description: "Envia avisos importantes para o seu WhatsApp.",
      },
    ],
  },
  {
    group: "Leads",
    icon: UserPlus,
    items: [
      {
        key: "notifyNewLeads",
        title: "Avisar quando chegar um novo lead",
        description: "Informa quando um novo contato for atribuído a você.",
      },
      {
        key: "notifySla",
        title: "Lembrar sobre contatos pendentes",
        description: "Avisa quando um lead estiver aguardando atendimento.",
      },
    ],
  },
  {
    group: "Campanhas",
    icon: Mail,
    items: [
      {
        key: "notifyCampaigns",
        title: "Avisar quando uma campanha terminar",
        description: "Informa quando o envio de uma campanha for concluído.",
      },
    ],
  },
  {
    group: "Segurança",
    icon: ShieldCheck,
    items: [
      {
        key: "notifySecurity",
        title: "Avisos de segurança",
        description:
          "Informa sobre acessos e mudanças importantes na sua conta.",
      },
    ],
  },
];

export default function SettingsCenter() {
  const [me, setMe] = useState<SettingsMe | null>(null);
  const [active, setActive] = useState<SettingsSection>("account");
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    settingsService
      .me()
      .then(setMe)
      .catch(() =>
        setError(
          "Não foi possível carregar suas configurações. Tente novamente.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  const allowed = useMemo(
    () => NAV.filter((item) => me?.capabilities.sections.includes(item.id)),
    [me],
  );
  useEffect(() => {
    if (!me || active === "account" || active === "users") return;
    const loaders: Partial<Record<SettingsSection, () => Promise<unknown>>> = {
      organization: settingsService.organization,
      roles: settingsService.permissions,
      security: settingsService.security,
      notifications: settingsService.notifications,
      branding: settingsService.branding,
      operations: settingsService.operations,
      integrations: settingsService.integrations,
      audit: settingsService.audit,
      system: settingsService.system,
    };
    loaders[active]?.()
      .then(setData)
      .catch(() =>
        setError("Não foi possível carregar esta área. Tente novamente."),
      )
      .finally(() => setLoading(false));
  }, [active, me]);

  const open = (id: SettingsSection) => {
    setLoading(!["account", "users"].includes(id));
    setError("");
    setNotice("");
    setActive(id);
  };
  if (loading && !me) return <Skeleton />;
  if (!me) return <ErrorBox message={error} />;
  return (
    <main className="space-y-7 pb-14">
      <PageHeader
        title="Configurações"
        description="Personalize sua experiência e gerencie tudo o que mantém sua empresa funcionando."
        action={
          <Badge variant="primary">
            <Fingerprint className="mr-1 h-3.5 w-3.5" />
            {ROLE_LABEL[me.businessRole] ?? CUSTOM_ROLE_LABEL}
          </Badge>
        }
      />
      <div className="lg:hidden">
        <Select
          aria-label="Área das configurações"
          value={active}
          onChange={(event) => open(event.target.value as SettingsSection)}
          options={allowed.map((item) => ({
            value: item.id,
            label: item.label,
          }))}
        />
      </div>
      <div className="grid gap-7 lg:grid-cols-[290px_minmax(0,1fr)]">
        <Card padding="sm" className="hidden h-fit lg:block">
          <nav aria-label="Configurações" className="space-y-1.5">
            {allowed.map((item) => (
              <button
                key={item.id}
                onClick={() => open(item.id)}
                className={`group flex min-h-16 w-full items-center gap-3 rounded-xl px-3 text-left transition ${active === item.id ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <span
                  className={`rounded-xl p-2 ${active === item.id ? "bg-white text-blue-600 shadow-sm" : "bg-slate-100 text-slate-500 group-hover:bg-white"}`}
                >
                  <item.icon className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-normal text-slate-500">
                    {item.description}
                  </span>
                </span>
                <ChevronRight className="ml-auto h-4 w-4 shrink-0 opacity-50" />
              </button>
            ))}
          </nav>
        </Card>
        <section aria-live="polite">
          {notice && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
              <Check className="h-4 w-4" />
              {notice}
            </div>
          )}
          {error && (
            <div className="mb-5">
              <ErrorBox message={error} />
            </div>
          )}
          {loading ? (
            <Skeleton />
          ) : (
            <Section
              id={active}
              me={me}
              data={data}
              onMe={setMe}
              saved={() => setNotice("Alterações salvas com sucesso.")}
              fail={() =>
                setError(
                  "Não foi possível salvar as alterações. Tente novamente.",
                )
              }
            />
          )}
        </section>
      </div>
    </main>
  );
}

function Section({
  id,
  me,
  data,
  onMe,
  saved,
  fail,
}: {
  id: SettingsSection;
  me: SettingsMe;
  data: unknown;
  onMe: (me: SettingsMe) => void;
  saved: () => void;
  fail: () => void;
}) {
  if (id === "account")
    return <Account me={me} onMe={onMe} saved={saved} fail={fail} />;
  if (id === "organization")
    return (
      <Organization
        data={data as OrganizationSettings}
        saved={saved}
        fail={fail}
      />
    );
  if (id === "roles") return <Permissions data={data as PermissionMatrix} />;
  if (id === "security")
    return (
      <Security
        data={data as Record<string, unknown>}
        me={me}
        saved={saved}
        fail={fail}
      />
    );
  if (id === "notifications")
    return (
      <Notifications data={data as SettingsMe} saved={saved} fail={fail} />
    );
  if (id === "branding")
    return (
      <Appearance
        data={data as Record<string, unknown>}
        saved={saved}
        fail={fail}
      />
    );
  if (id === "operations")
    return (
      <Operations
        data={data as Record<string, unknown>}
        saved={saved}
        fail={fail}
      />
    );
  if (id === "integrations")
    return <Integrations data={data as IntegrationStatus} />;
  if (id === "audit") return <ActivityHistory data={data as AuditEntry[]} />;
  if (id === "system")
    return (
      <SystemSettings
        data={data as Record<string, unknown>}
        saved={saved}
        fail={fail}
      />
    );
  return (
    <Card>
      <SectionHeading
        icon={Users}
        title="Administração de usuários"
        text="Organize seus colaboradores, funções e acessos em um só lugar."
      />
      <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50/70 p-6">
        <h3 className="font-semibold text-slate-900">Central de Usuários</h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Cadastre colaboradores, controle acessos e consulte as pessoas que
          fazem parte da sua empresa.
        </p>
        <Link
          className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 font-semibold text-white shadow-sm hover:bg-blue-700"
          href="/users"
        >
          <Users className="mr-2 h-4 w-4" />
          Administrar usuários
        </Link>
      </div>
    </Card>
  );
}

function Account({
  me,
  onMe,
  saved,
  fail,
}: {
  me: SettingsMe;
  onMe: (me: SettingsMe) => void;
  saved: () => void;
  fail: () => void;
}) {
  const [form, setForm] = useState({
    name: me.name,
    phone: me.phone ?? "",
    language: me.settings?.language ?? "pt-BR",
    timezone: me.settings?.timezone ?? "America/Sao_Paulo",
    dateFormat: me.settings?.dateFormat ?? "DD/MM/YYYY",
  });
  const field = (key: keyof typeof form, value: string) =>
    setForm({ ...form, [key]: value });
  const save = () =>
    settingsService
      .updateMe(form)
      .then((result) => {
        onMe(result);
        saved();
      })
      .catch(fail);
  return (
    <Card padding="lg">
      <SectionHeading
        icon={CircleUserRound}
        title="Minha conta"
        text="Mantenha seus dados pessoais e preferências sempre atualizados."
      />
      <div className="mt-8 grid gap-x-6 gap-y-7 sm:grid-cols-2">
        <ExplainedField
          label="Nome completo"
          description="Como seu nome será exibido no sistema."
        >
          <Input
            value={form.name}
            onChange={(e) => field("name", e.target.value)}
          />
        </ExplainedField>
        <ExplainedField
          label="E-mail"
          description="Usado para entrar na sua conta e receber comunicações."
        >
          <Input value={me.email} disabled className="cursor-not-allowed" />
        </ExplainedField>
        <ExplainedField
          label="Telefone"
          description="Utilizado para contato e recuperação de conta."
        >
          <Input
            value={form.phone}
            onChange={(e) => field("phone", e.target.value)}
          />
        </ExplainedField>
        <ExplainedField
          label="Idioma"
          description="Idioma utilizado em toda a plataforma."
        >
          <Select
            value={form.language}
            onChange={(e) => field("language", e.target.value)}
            options={[
              { value: "pt-BR", label: "Português (Brasil)" },
              { value: "en-US", label: "Inglês" },
              { value: "es", label: "Espanhol" },
            ]}
          />
        </ExplainedField>
        <ExplainedField
          label="Fuso horário"
          description="Utilizado em relatórios e agendamentos."
        >
          <Input
            value={form.timezone}
            onChange={(e) => field("timezone", e.target.value)}
          />
        </ExplainedField>
        <ExplainedField
          label="Formato de data"
          description="Define como as datas aparecem para você."
        >
          <Select
            value={form.dateFormat}
            onChange={(e) => field("dateFormat", e.target.value)}
            options={[
              { value: "DD/MM/YYYY", label: "Dia / mês / ano" },
              { value: "MM/DD/YYYY", label: "Mês / dia / ano" },
              { value: "YYYY-MM-DD", label: "Ano / mês / dia" },
            ]}
          />
        </ExplainedField>
      </div>
      <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
        <Button size="lg" onClick={save}>
          <Save className="h-4 w-4" />
          Salvar alterações
        </Button>
      </div>
    </Card>
  );
}

function Organization({
  data,
  saved,
  fail,
}: {
  data: OrganizationSettings;
  saved: () => void;
  fail: () => void;
}) {
  const fields = [
    ["name", "Nome da empresa", "Como a empresa será identificada no sistema."],
    ["legalName", "Razão social", "Nome oficial registrado da empresa."],
    ["document", "CNPJ ou documento", "Documento de identificação da empresa."],
    ["email", "E-mail da empresa", "Canal principal para comunicações."],
    ["phone", "Telefone", "Número principal de contato da empresa."],
    [
      "timezone",
      "Fuso horário",
      "Usado nos relatórios e agendamentos da empresa.",
    ],
  ];
  return (
    <FriendlyForm
      key="organization-settings"
      icon={Building2}
      title="Empresa"
      description="Atualize os dados e as preferências gerais da sua empresa."
      initial={data as unknown as Record<string, unknown>}
      fields={fields}
      submit={settingsService.updateOrganization}
      saved={saved}
      fail={fail}
    />
  );
}

function Appearance({
  data,
  saved,
  fail,
}: {
  data: Record<string, unknown>;
  saved: () => void;
  fail: () => void;
}) {
  const fields = [
    [
      "displayName",
      "Nome exibido",
      "Nome apresentado nos espaços personalizados.",
    ],
    [
      "logoUrl",
      "Imagem da marca",
      "Endereço da imagem usada como marca da empresa.",
    ],
    [
      "faviconUrl",
      "Ícone da empresa",
      "Pequena imagem exibida na aba do navegador.",
    ],
    [
      "primaryColor",
      "Cor principal",
      "Cor usada em botões e elementos de destaque.",
    ],
    [
      "secondaryColor",
      "Cor complementar",
      "Cor usada para complementar a identidade visual.",
    ],
    ["signature", "Assinatura", "Texto usado ao final das comunicações."],
    [
      "footer",
      "Rodapé",
      "Informação exibida no final das páginas personalizadas.",
    ],
  ];
  return (
    <FriendlyForm
      key="appearance-settings"
      icon={Palette}
      title="Aparência"
      description="Deixe o Impulse CRM com a identidade visual da sua empresa."
      initial={data}
      fields={fields}
      submit={settingsService.updateBranding}
      saved={saved}
      fail={fail}
    />
  );
}

function Operations({
  data,
  saved,
  fail,
}: {
  data: Record<string, unknown>;
  saved: () => void;
  fail: () => void;
}) {
  const fields = [
    [
      "businessStartsAt",
      "Início do atendimento",
      "Horário em que sua equipe começa a receber e atender contatos.",
    ],
    [
      "businessEndsAt",
      "Fim do atendimento",
      "Horário em que termina o período normal de atendimento.",
    ],
    [
      "dailyLeadLimit",
      "Limite diário de contatos",
      "Quantidade máxima de novos contatos distribuídos por dia.",
    ],
    [
      "slaMinutes",
      "Tempo esperado para o primeiro atendimento",
      "Prazo recomendado para iniciar o atendimento de um novo contato.",
    ],
    [
      "contactAttempts",
      "Tentativas de contato",
      "Quantas tentativas devem ser realizadas antes de encerrar o atendimento.",
    ],
    [
      "redistributionMinutes",
      "Tempo para redistribuição",
      "Após esse período sem atendimento, o contato poderá ser enviado para outra pessoa.",
    ],
  ];
  return (
    <FriendlyForm
      key="operations-settings"
      icon={Gauge}
      title="Atendimento"
      description="Horários, limites e regras de distribuição dos contatos."
      initial={data}
      fields={fields}
      numericKeys={[
        "dailyLeadLimit",
        "slaMinutes",
        "contactAttempts",
        "redistributionMinutes",
      ]}
      submit={settingsService.updateOperations}
      saved={saved}
      fail={fail}
    />
  );
}

function FriendlyForm({
  icon,
  title,
  description,
  initial,
  fields,
  numericKeys = [],
  submit,
  saved,
  fail,
}: {
  icon: Icon;
  title: string;
  description: string;
  initial: Record<string, unknown>;
  fields: string[][];
  numericKeys?: string[];
  submit: (data: unknown) => Promise<unknown>;
  saved: () => void;
  fail: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map(([key]) => [key, String(initial?.[key] ?? "")]),
    ),
  );
  const payload = () =>
    Object.fromEntries(
      Object.entries(form).map(([key, value]) => [
        key,
        numericKeys.includes(key) && value ? Number(value) : value,
      ]),
    );
  return (
    <Card padding="lg">
      <SectionHeading icon={icon} title={title} text={description} />
      <div className="mt-8 grid gap-x-6 gap-y-7 sm:grid-cols-2">
        {fields.map(([key, label, help]) => (
          <ExplainedField key={key} label={label} description={help}>
            <Input
              type={
                numericKeys.includes(key)
                  ? "number"
                  : key.endsWith("At")
                    ? "time"
                    : "text"
              }
              value={form[key]}
              onChange={(event) =>
                setForm({ ...form, [key]: event.target.value })
              }
            />
          </ExplainedField>
        ))}
      </div>
      <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
        <Button
          size="lg"
          onClick={() => submit(payload()).then(saved).catch(fail)}
        >
          <Save className="h-4 w-4" />
          Salvar alterações
        </Button>
      </div>
    </Card>
  );
}

function Permissions({ data }: { data: PermissionMatrix }) {
  const codes = [
    ...new Set(
      data.roles.flatMap((role) =>
        role.permissions.map((item) => item.permission.code),
      ),
    ),
  ];
  return (
    <Card padding="none">
      <div className="p-7">
        <SectionHeading
          icon={KeyRound}
          title="Permissões de acesso"
          text="Veja com clareza o que cada perfil pode visualizar ou alterar."
        />
      </div>
      <TableContainer className="rounded-none border-x-0 border-b-0 shadow-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Permissão</TableHead>
              {data.roles.map((role) => (
                <TableHead key={role.code} align="center">
                  {ROLE_LABEL[role.code] ?? CUSTOM_ROLE_LABEL}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.map((code) => {
              const permission = PERMISSIONS[code] ?? CUSTOM_PERMISSION;
              return (
                <TableRow key={code}>
                  <TableCell>
                    <div className="min-w-64 py-1">
                      <p className="font-semibold text-slate-900">
                        {permission.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {permission.description}
                      </p>
                    </div>
                  </TableCell>
                  {data.roles.map((role) => (
                    <TableCell key={role.code} align="center">
                      {role.permissions.some(
                        (item) => item.permission.code === code,
                      ) ? (
                        <span
                          className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50"
                          title="Permitido"
                        >
                          <Check className="h-4 w-4 text-emerald-600" />
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

function Security({
  data,
  me,
  saved,
  fail,
}: {
  data: Record<string, unknown>;
  me: SettingsMe;
  saved: () => void;
  fail: () => void;
}) {
  const [session, setSession] = useState(String(data?.sessionTtlMinutes ?? ""));
  const [attempts, setAttempts] = useState(
    String(data?.maxLoginAttempts ?? ""),
  );
  const save = () =>
    settingsService
      .updateSecurity({
        ...(session ? { sessionTtlMinutes: Number(session) } : {}),
        ...(attempts ? { maxLoginAttempts: Number(attempts) } : {}),
      })
      .then(saved)
      .catch(fail);
  const cards = [
    {
      icon: KeyRound,
      title: "Alterar senha",
      text: "A troca de senha será disponibilizada em uma próxima atualização.",
      status: "Em breve",
    },
    {
      icon: Smartphone,
      title: "Autenticação em dois fatores",
      text: "A confirmação adicional ao entrar ainda está em preparação.",
      status: "Em breve",
    },
    {
      icon: Laptop,
      title: "Dispositivos conectados",
      text: "Veja os computadores e celulares que acessaram sua conta.",
      status: `${me.authSessions.length} conectado(s)`,
    },
    {
      icon: MonitorCheck,
      title: "Sessões ativas",
      text: "Acompanhe onde sua conta está aberta neste momento.",
      status: `${me.authSessions.length} sessão(ões)`,
    },
  ];
  return (
    <div className="space-y-6">
      <Card padding="lg">
        <SectionHeading
          icon={ShieldCheck}
          title="Segurança"
          text="Proteja sua conta e acompanhe seus acessos com tranquilidade."
        />
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {cards.map((item) => (
            <FeatureCard key={item.title} {...item} />
          ))}
        </div>
      </Card>
      <Card padding="lg">
        <h3 className="text-lg font-bold text-slate-950">Proteção de acesso</h3>
        <p className="mt-1 text-sm text-slate-500">
          Defina limites que ajudam a manter todas as contas seguras.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <ExplainedField
            label="Tempo máximo de login"
            description="Define por quanto tempo uma conta permanece conectada, em minutos."
          >
            <Input
              type="number"
              value={session}
              onChange={(e) => setSession(e.target.value)}
              placeholder="Ex.: 480"
            />
          </ExplainedField>
          <ExplainedField
            label="Tentativas de acesso"
            description="Limita tentativas consecutivas antes de proteger a conta."
          >
            <Input
              type="number"
              value={attempts}
              onChange={(e) => setAttempts(e.target.value)}
              placeholder="Ex.: 5"
            />
          </ExplainedField>
        </div>
        <div className="mt-7 flex justify-end">
          <Button size="lg" onClick={save}>
            <Save className="h-4 w-4" />
            Salvar proteção
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Notifications({
  data,
  saved,
  fail,
}: {
  data: SettingsMe;
  saved: () => void;
  fail: () => void;
}) {
  const keys = NOTIFICATIONS.flatMap((group) =>
    group.items.map((item) => item.key),
  );
  const customKeys = Object.entries(data.settings ?? {})
    .filter(
      ([key, value]) =>
        key.startsWith("notify") &&
        typeof value === "boolean" &&
        !keys.includes(key),
    )
    .map(([key]) => key);
  const groups = customKeys.length
    ? [
        ...NOTIFICATIONS,
        {
          group: "Outros avisos",
          icon: Bell,
          items: customKeys.map((key) => ({ key, ...CUSTOM_NOTIFICATION })),
        },
      ]
    : NOTIFICATIONS;
  const allKeys = [...keys, ...customKeys];
  const [form, setForm] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      allKeys.map((key) => [
        key,
        Boolean(
          data.settings?.[key as keyof NonNullable<SettingsMe["settings"]>],
        ),
      ]),
    ),
  );
  return (
    <Card padding="lg">
      <SectionHeading
        icon={Bell}
        title="Notificações"
        text="Escolha os avisos que deseja receber e mantenha o foco no que importa."
      />
      <div className="mt-8 space-y-8">
        {groups.map((group) => (
          <div key={group.group}>
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <group.icon className="h-4 w-4 text-blue-600" />
              {group.group}
            </div>
            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
              {group.items.map((item) => (
                <label
                  key={item.key}
                  className="flex min-h-20 cursor-pointer items-center justify-between gap-5 bg-white px-5 py-4 hover:bg-slate-50/70"
                >
                  <span>
                    <span className="block font-semibold text-slate-900">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-slate-500">
                      {item.description}
                    </span>
                  </span>
                  <Switch
                    checked={form[item.key]}
                    onChange={(checked) =>
                      setForm({ ...form, [item.key]: checked })
                    }
                    label={item.title}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
        <Button
          size="lg"
          onClick={() =>
            settingsService.updateNotifications(form).then(saved).catch(fail)
          }
        >
          <Save className="h-4 w-4" />
          Salvar preferências
        </Button>
      </div>
    </Card>
  );
}

const INTEGRATION_STATUS: Record<string, string> = {
  available: "Disponível",
  managed: "Gerenciado pelo Impulse CRM",
  active: "Conectado",
  inactive: "Desconectado",
  error: "Requer atenção",
};
const INTEGRATION_HEALTH: Record<string, string> = {
  operational: "Funcionando normalmente",
  operacional: "Funcionando normalmente",
  healthy: "Funcionando normalmente",
  active: "Conectado",
  inactive: "Desconectado",
  error: "Requer atenção",
  unavailable: "Temporariamente indisponível",
  "disponível no módulo responsável": "Disponível na área correspondente",
};
function Integrations({ data }: { data: IntegrationStatus }) {
  return (
    <Card padding="lg">
      <SectionHeading
        icon={Cable}
        title="Integrações"
        text="Conecte os serviços que sua empresa usa todos os dias."
      />
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {data.items.map((item) => {
          const status =
            INTEGRATION_STATUS[item.status] ?? "Situação não disponível";
          const health =
            INTEGRATION_HEALTH[item.health.toLowerCase()] ??
            (item.status === "error"
              ? "Requer atenção"
              : "Situação não disponível");
          const attention =
            item.status === "error" || item.health.toLowerCase() === "error";
          return (
            <Link
              key={item.id}
              href={item.href}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
            >
              <span
                className={`rounded-xl p-3 ${attention ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}
              >
                <Cable className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-semibold text-slate-900">
                  {item.name}
                </span>
                <span className="mt-1 block text-sm text-slate-500">
                  {health}
                </span>
              </span>
              <Badge
                className="ml-auto"
                variant={attention ? "warning" : "default"}
              >
                {status}
              </Badge>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

function ActivityHistory({ data }: { data: AuditEntry[] }) {
  const actionName = (action: string) =>
    action.includes("profile")
      ? "Dados pessoais atualizados"
      : action.includes("password")
        ? "Senha alterada"
        : action.includes("permissions")
          ? "Permissões atualizadas"
          : action.includes("organization")
            ? "Empresa atualizada"
            : action.includes("notification")
              ? "Notificações atualizadas"
              : action.includes("security")
                ? "Proteção atualizada"
                : action.includes("branding")
                  ? "Aparência atualizada"
                  : "Configuração salva";
  return (
    <Card padding="lg">
      <SectionHeading
        icon={History}
        title="Histórico de atividades"
        text="Acompanhe as alterações importantes realizadas na sua conta e empresa."
      />
      {data.length ? (
        <div className="mt-8 space-y-0">
          {data.map((item, index) => (
            <div key={item.id} className="relative flex gap-4 pb-7 last:pb-0">
              {index < data.length - 1 && (
                <span className="absolute left-[19px] top-10 h-[calc(100%-24px)] w-px bg-slate-200" />
              )}
              <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-4 ring-white">
                <Check className="h-4 w-4" />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="font-semibold text-slate-900">
                  {actionName(item.action)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {item.actorUser?.name ?? "Impulse CRM"} ·{" "}
                  {new Date(item.occurredAt).toLocaleString("pt-BR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 py-14 text-center">
          <History className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 font-semibold text-slate-700">
            Nenhuma atividade registrada ainda.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            As alterações importantes aparecerão aqui.
          </p>
        </div>
      )}
    </Card>
  );
}

function SystemSettings({
  data,
  saved,
  fail,
}: {
  data: Record<string, unknown>;
  saved: () => void;
  fail: () => void;
}) {
  const [form, setForm] = useState({
    maintenanceMode: Boolean(data.maintenanceMode),
    allowOrganizationBranding: Boolean(data.allowOrganizationBranding),
  });
  const display = (key: string) =>
    typeof data[key] === "string" && data[key]
      ? String(data[key])
      : "Informação não disponível";
  const updatedAt =
    typeof data.updatedAt === "string"
      ? new Date(data.updatedAt).toLocaleString("pt-BR", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "Informação não disponível";
  const cards = [
    {
      icon: Sparkles,
      label: "Versão do Impulse CRM",
      value: display("version"),
    },
    { icon: Clock3, label: "Última atualização", value: updatedAt },
    {
      icon: Database,
      label: "Banco de dados",
      value: display("databaseStatus"),
    },
    {
      icon: MonitorCheck,
      label: "Status do sistema",
      value: form.maintenanceMode
        ? "Acesso temporariamente pausado"
        : "Acesso normal",
    },
    { icon: Server, label: "Servidor", value: display("serverStatus") },
    { icon: ShieldCheck, label: "Licença", value: display("licenseStatus") },
    { icon: HardDrive, label: "Backup", value: display("backupStatus") },
  ];
  const controls = [
    {
      key: "maintenanceMode" as const,
      title: "Pausar temporariamente o acesso",
      description:
        "Use somente durante uma atualização ou manutenção programada.",
    },
    {
      key: "allowOrganizationBranding" as const,
      title: "Permitir personalização por empresa",
      description:
        "Permite que cada empresa utilize sua própria marca e identidade visual.",
    },
  ];
  return (
    <div className="space-y-6">
      <Card padding="lg">
        <SectionHeading
          icon={MonitorCheck}
          title="Sistema"
          text="Consulte informações fornecidas pela plataforma sem estimativas ou diagnósticos presumidos."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5"
            >
              <span className="inline-flex rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <item.icon className="h-5 w-5" />
              </span>
              <p className="mt-5 text-sm font-medium text-slate-500">
                {item.label}
              </p>
              <p className="mt-1 font-bold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card padding="lg">
        <h3 className="text-lg font-bold text-slate-950">
          Controles do sistema
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Altere somente quando necessário para a operação da plataforma.
        </p>
        <div className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
          {controls.map((item) => (
            <div
              key={item.key}
              className="flex min-h-20 items-center justify-between gap-5 px-5 py-4"
            >
              <span>
                <span className="block font-semibold text-slate-900">
                  {item.title}
                </span>
                <span className="mt-1 block text-sm text-slate-500">
                  {item.description}
                </span>
              </span>
              <Switch
                checked={form[item.key]}
                onChange={(checked) =>
                  setForm({ ...form, [item.key]: checked })
                }
                label={item.title}
              />
            </div>
          ))}
        </div>
        <div className="mt-7 flex justify-end">
          <Button
            size="lg"
            onClick={() =>
              settingsService.updateSystem(form).then(saved).catch(fail)
            }
          >
            <Save className="h-4 w-4" />
            Salvar controles
          </Button>
        </div>
      </Card>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  text,
  status,
}: {
  icon: Icon;
  title: string;
  text: string;
  status: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <span className="inline-flex rounded-xl bg-blue-50 p-2.5 text-blue-600">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
      <p
        className={`mt-4 text-xs font-semibold ${status === "Em breve" ? "text-slate-500" : "text-emerald-700"}`}
      >
        {status}
      </p>
    </div>
  );
}
function SectionHeading({
  icon: Icon,
  title,
  text,
}: {
  icon: Icon;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="rounded-2xl bg-blue-50 p-3 text-blue-600">
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <h2 className="text-xl font-bold text-slate-950">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
          {text}
        </p>
      </div>
    </div>
  );
}
function ExplainedField({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </span>
      {children}
      <span className="mt-2 block text-xs leading-5 text-slate-500">
        {description}
      </span>
    </label>
  );
}
function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-slate-300"}`}
    >
      <span
        className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}
function ErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
    >
      {message}
    </div>
  );
}
function Skeleton() {
  return (
    <div className="flex min-h-52 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500">
      <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
      Carregando suas preferências…
    </div>
  );
}
