"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Building2,
  Check,
  Clipboard,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Organization } from "@/types/organization";
import { User, UserFormData, UserRole } from "@/types/user";

interface Props {
  user?: User | null;
  organizations: Organization[];
  saving: boolean;
  canAssignOrganizations: boolean;
  allowedRoles: UserRole[];
  onCancel: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
}

const roleLabels: Record<UserRole, string> = {
  GLOBAL_ADMIN: "Administrador global",
  ADMIN: "Administrador",
  ORG_ADMIN: "Administrador da organização",
  MANAGER: "Gerente",
  CORRETOR: "Corretor",
  BROKER: "Corretor",
};

export function generateTemporaryPassword() {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const random = crypto.getRandomValues(new Uint32Array(14));
  return Array.from(random, (value) => characters[value % characters.length]).join("");
}

export function getPasswordStrength(password = "") {
  const points = [
    password.length >= 8,
    password.length >= 12,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^\w]/.test(password),
  ].filter(Boolean).length;

  if (points <= 2) return { level: 1, label: "Fraca", color: "bg-red-400" };
  if (points <= 3) return { level: 2, label: "Média", color: "bg-amber-400" };
  if (points <= 5) return { level: 3, label: "Boa", color: "bg-blue-500" };
  return { level: 4, label: "Excelente", color: "bg-emerald-500" };
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="rounded-xl bg-blue-50 p-2 text-blue-600">
        <Icon size={18} />
      </span>
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export default function UserForm({
  user,
  organizations,
  saving,
  canAssignOrganizations,
  allowedRoles,
  onCancel,
  onSubmit,
}: Props) {
  const nameParts = (user?.name ?? "").trim().split(/\s+/);
  const [firstName, setFirstName] = useState(nameParts.shift() ?? "");
  const [lastName, setLastName] = useState(nameParts.join(" "));
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sendInvite, setSendInvite] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<UserFormData>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    phone: user?.phone ?? "",
    title: user?.title ?? "",
    role: user?.role ?? allowedRoles.at(-1) ?? "CORRETOR",
    organizationId: user?.organizationId ?? "",
    active: user?.active ?? true,
  });

  const strength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password]
  );

  const field = <Key extends keyof UserFormData>(
    key: Key,
    value: UserFormData[Key]
  ) => setForm((current) => ({ ...current, [key]: value }));

  function generatePassword() {
    const password = generateTemporaryPassword();
    field("password", password);
    setConfirmPassword(password);
  }

  async function copyPassword() {
    if (!form.password) return;
    await navigator.clipboard.writeText(form.password);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const fullName = `${firstName} ${lastName}`.trim();

    if (!firstName.trim() || !lastName.trim()) {
      setError("Informe nome e sobrenome.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Informe um e-mail válido.");
      return;
    }
    if (!user && (!form.password || form.password.length < 8)) {
      setError("A senha deve ter ao menos 8 caracteres.");
      return;
    }
    if (!user && form.password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (
      canAssignOrganizations &&
      !form.organizationId &&
      !["ADMIN", "GLOBAL_ADMIN"].includes(form.role)
    ) {
      setError("Selecione a organização.");
      return;
    }

    setError("");
    await onSubmit({
      ...form,
      name: fullName,
      email: form.email.trim().toLowerCase(),
      phone: form.phone?.trim() || undefined,
      title: form.title?.trim() || undefined,
      password: user ? undefined : form.password,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <Card padding="sm" className="hover:border-slate-200/80 hover:shadow-none">
        <SectionTitle icon={UserRound} title="Dados pessoais" description="Informações usadas para identificar e contatar o usuário." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nome" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
          <Input label="Sobrenome" value={lastName} onChange={(event) => setLastName(event.target.value)} required />
          <Input label="E-mail" type="email" value={form.email} onChange={(event) => field("email", event.target.value)} required />
          <Input label="Telefone" value={form.phone} onChange={(event) => field("phone", event.target.value)} placeholder="(11) 99999-9999" />
          <div className="sm:col-span-2">
            <Input label="Cargo" value={form.title} onChange={(event) => field("title", event.target.value)} placeholder="Ex.: Coordenador comercial" />
          </div>
        </div>
      </Card>

      {!user && (
        <Card padding="sm" className="hover:border-slate-200/80 hover:shadow-none">
          <SectionTitle icon={KeyRound} title="Acesso" description="Defina uma credencial temporária segura para o primeiro acesso." />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative">
              <Input label="Senha" type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => field("password", event.target.value)} minLength={8} required />
              <button type="button" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute right-3 top-10 rounded-lg p-1 text-slate-500 hover:bg-slate-100" onClick={() => setShowPassword((current) => !current)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Input label="Confirmar senha" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
            <div className="sm:col-span-2">
              <div className="flex gap-1" aria-label={`Força da senha: ${strength.label}`}>
                {[1, 2, 3, 4].map((level) => (
                  <span key={level} className={`h-1.5 flex-1 rounded-full ${level <= strength.level ? strength.color : "bg-slate-200"}`} />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>Força: <strong className="text-slate-700">{strength.label}</strong></span>
                <span>Use 8+ caracteres, maiúscula, número e símbolo.</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={generatePassword}><KeyRound size={15} />Gerar senha</Button>
                <Button size="sm" variant="secondary" onClick={() => void copyPassword()} disabled={!form.password}><Clipboard size={15} />{copied ? "Copiada" : "Copiar"}</Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card padding="sm" className="hover:border-slate-200/80 hover:shadow-none">
        <SectionTitle icon={Building2} title="Organização" description="Determine o escopo, a função e o estado do acesso." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Função" value={form.role} onChange={(event) => field("role", event.target.value as UserRole)} options={allowedRoles.map((role) => ({ value: role, label: roleLabels[role] }))} />
          <Select label="Status" value={String(form.active)} onChange={(event) => field("active", event.target.value === "true")} options={[{ value: "true", label: "Ativo" }, { value: "false", label: "Inativo" }]} />
          {canAssignOrganizations ? (
            <div className="sm:col-span-2">
              <Select label="Organização" value={form.organizationId} onChange={(event) => field("organizationId", event.target.value)} options={[{ value: "", label: "Escopo global / selecione" }, ...organizations.map((organization) => ({ value: organization.id, label: organization.name }))]} />
            </div>
          ) : (
            <p className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">A organização será definida automaticamente conforme o seu escopo.</p>
          )}
        </div>
      </Card>

      <Card padding="sm" className="hover:border-slate-200/80 hover:shadow-none">
        <SectionTitle icon={ShieldCheck} title="Permissões" description="O acesso inicial será herdado da função selecionada." />
        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
          <div><p className="text-sm font-semibold text-slate-800">Perfil de {roleLabels[form.role]}</p><p className="mt-1 text-xs text-slate-500">As permissões detalhadas podem ser consultadas no painel do usuário.</p></div>
          <Badge variant="primary"><Check size={12} className="mr-1" />Herdado</Badge>
        </div>
        {!user && (
          <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <input type="checkbox" checked={sendInvite} onChange={(event) => setSendInvite(event.target.checked)} className="h-4 w-4 accent-blue-600" />
            <Mail size={18} className="text-blue-600" />
            <span><strong className="block text-sm text-slate-800">Enviar convite</strong><span className="text-xs text-slate-500">Preparar instruções de acesso para envio por e-mail.</span></span>
          </label>
        )}
      </Card>

      <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white/95 pt-5 backdrop-blur">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={saving}>{user ? "Salvar alterações" : "Criar usuário"}</Button>
      </div>
    </form>
  );
}
