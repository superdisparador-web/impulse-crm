"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  UserCog,
  MessageCircle,
  Megaphone,
  CalendarClock,
  Shuffle,
  Building2,
  UserRoundCog,
  Settings,
} from "lucide-react";

const menu = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Leads",
    href: "/leads",
    icon: Users,
  },
  {
    title: "Pipeline",
    href: "/pipeline",
    icon: KanbanSquare,
  },
  {
    title: "Agentes",
    href: "/agents",
    icon: UserCog,
  },
  {
    title: "WhatsApp",
    href: "/whatsapp",
    icon: MessageCircle,
  },
  {
    title: "Campanhas",
    href: "/campaigns",
    icon: Megaphone,
  },
  {
    title: "Follow-ups",
    href: "/followups",
    icon: CalendarClock,
  },
  {
    title: "Distribuição",
    href: "/distribution",
    icon: Shuffle,
  },
  {
    title: "Organizações",
    href: "/organizations",
    icon: Building2,
  },
  {
    title: "Usuários",
    href: "/users",
    icon: UserRoundCog,
  },
  {
    title: "Configurações",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white">
          🚀 Impulse CRM
        </h1>

        <p className="text-sm text-slate-400 mt-1">
          CRM Inteligente
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                pathname === item.href
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Icon size={20} />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}