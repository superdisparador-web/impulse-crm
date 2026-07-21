"use client";

import Button from "@/components/ui/Button";
import { User } from "@/types/user";

interface UserTableProps {
  users: User[];
  loading: boolean;
  error: string;
  canManage: boolean;
  onEdit: (user: User) => void;
  onStatus: (user: User) => void;
  onDelete: (user: User) => void;
  onResetPassword: (user: User) => void;
}

function formatDate(value: string) { return new Intl.DateTimeFormat('pt-BR').format(new Date(value)); }

export default function UserTable({ users, loading, error, canManage, onEdit, onStatus, onDelete, onResetPassword }: UserTableProps) {
  return <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
    <table className="w-full min-w-[1080px]">
      <thead className="bg-slate-800"><tr><th className="p-4 text-left">Nome</th><th className="p-4 text-left">E-mail</th><th className="p-4 text-left">Telefone</th><th className="p-4 text-left">Organização</th><th className="p-4 text-left">Papel</th><th className="p-4 text-center">Status</th><th className="p-4 text-left">Criado em</th><th className="p-4 text-right">Ações</th></tr></thead>
      <tbody>
        {loading && <tr><td colSpan={8} className="p-8 text-center">Carregando usuários...</td></tr>}
        {!loading && error && <tr><td colSpan={8} className="p-8 text-center text-red-400">{error}</td></tr>}
        {!loading && !error && users.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-slate-400">Nenhum usuário encontrado.</td></tr>}
        {!loading && !error && users.map((user) => <tr key={user.id} className="border-t border-slate-800 hover:bg-slate-800/50"><td className="p-4 font-medium">{user.name}</td><td className="p-4 text-slate-300">{user.email}</td><td className="p-4 text-slate-300">{user.phone || "—"}</td><td className="p-4 text-slate-300">{user.organization?.name || "Global"}</td><td className="p-4 text-slate-300">{user.role}</td><td className="p-4 text-center">{user.active ? "🟢 Ativo" : "🔴 Inativo"}</td><td className="p-4 text-slate-300">{formatDate(user.createdAt)}</td><td className="p-4"><div className="flex flex-wrap justify-end gap-2">{canManage ? <><Button variant="secondary" onClick={() => onEdit(user)}>Editar</Button><Button variant="secondary" onClick={() => onResetPassword(user)}>Resetar senha</Button><Button variant="secondary" onClick={() => onStatus(user)}>{user.active ? "Desativar" : "Ativar"}</Button><Button variant="danger" onClick={() => onDelete(user)}>Excluir</Button></> : <span className="text-sm text-slate-500">Sem permissão</span>}</div></td></tr>)}
      </tbody>
    </table>
  </div>;
}
