"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
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

const Image = dynamic(() => import("next/image"));

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
    <aside className="flex h-screen w-20 shrink-0 flex-col border-r border-slate-800/80 bg-slate-950 shadow-xl shadow-slate-950/10 transition-[width] duration-300 lg:w-64">
      <div className="flex min-h-20 items-center border-b border-slate-800/80 px-3 lg:px-5">
        <Link href="/dashboard" className="flex w-full justify-center rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 lg:justify-start" aria-label="Impulse CRM — Dashboard">
          <Image
            src="/branding/impulse-logo-horizontal.png"
            alt="Impulse CRM"
            width={1536}
            height={1024}
            priority
            className="h-12 w-12 object-contain lg:h-14 lg:w-44 lg:object-left"
          />
        </Link>
      </div>

      <nav aria-label="Navegação principal" className="flex-1 space-y-1.5 overflow-y-auto px-2.5 py-4 lg:px-3">
        {sidebarMenu.map((item) => {
          const Icon = item.icon;
          const active = isRouteActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={item.title}
              className={`group flex min-h-11 items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/80 lg:justify-start ${
                active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-950/30"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <Icon
                size={19}
                className={
                  active
                    ? "text-white"
                    : "text-slate-400 transition-colors group-hover:text-blue-300"
                }
              />

              <span className="hidden lg:inline">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-slate-800/80 p-3 lg:block">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 shadow-inner">
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
