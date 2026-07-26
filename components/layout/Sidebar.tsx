"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Cable,
  FileText,
  KanbanSquare,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Send,
  Settings,
  UserRoundCog,
  Users,
} from "lucide-react";

export const sidebarMenu = [
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
    title: "Corretores",
    href: "/corretores",
    icon: UserRoundCog,
  },
  {
    title: "WhatsApp",
    href: "/whatsapp",
    icon: MessageCircle,
  },
  {
    title: "Conexões",
    href: "/connections",
    icon: Cable,
  },
  {
    title: "Templates",
    href: "/templates",
    icon: FileText,
  },
  {
    title: "Campanhas",
    href: "/campaigns",
    icon: Megaphone,
  },
  {
    title: "Disparos",
    href: "/messaging",
    icon: Send,
  },
  {
    title: "Organizações",
    href: "/organizations",
    icon: Building2,
  },
  {
    title: "Configurações",
    href: "/settings",
    icon: Settings,
  },
];

function isRouteActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-slate-800 bg-slate-950">
      <div className="border-b border-slate-800 px-6 py-5">
        <Link href="/dashboard" className="block">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-950/40">
              I
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                Impulse CRM
              </h1>

              <p className="text-xs text-slate-400">
                Gestão inteligente
              </p>
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {sidebarMenu.map((item) => {
          const Icon = item.icon;
          const active = isRouteActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-950/40"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon
                size={19}
                className={
                  active
                    ? "text-white"
                    : "text-slate-400 transition group-hover:text-white"
                }
              />

              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
          <p className="text-sm font-semibold text-white">
            Rodrigo Lopes
          </p>

          <p className="mt-0.5 text-xs text-slate-400">
            Superintendência
          </p>
        </div>
      </div>
    </aside>
  );
}