"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import {
  Building2,
  FileText,
  KanbanSquare,
  LayoutDashboard,
  ChartNoAxesCombined,
  Megaphone,
  MessageCircle,
  Send,
  Settings,
  UserRoundCog,
  Users,
} from "lucide-react";
import { getCurrentUser } from "@/services/auth";

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
    title: "Leads recebidos",
    href: "/leads/received",
    icon: Send,
  },
  {
    title: "Desempenho",
    href: "/analytics",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Relatórios",
    href: "/reports",
    icon: FileText,
  },
  {
    title: "Funil de vendas",
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
    title: "Modelos de mensagem",
    href: "/templates",
    icon: FileText,
  },
  {
    title: "Campanhas",
    href: "/campaigns",
    icon: Megaphone,
  },
  {
    title: "Envios",
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
  const user = getCurrentUser();

  return (
    <aside className="relative flex h-dvh w-20 shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[linear-gradient(180deg,#071225_0%,#0a1730_52%,#07111f_100%)] shadow-[8px_0_32px_-20px_rgba(2,6,23,0.55)] transition-[width] duration-300 lg:w-64">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_transparent_68%)]" />
      <div className="relative flex min-h-24 items-center border-b border-white/8 px-2 lg:min-h-28 lg:px-3">
        <Link href="/dashboard" className="flex w-full justify-center overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" aria-label="Impulse CRM — Dashboard">
          <Image
            src="/branding/impulse-logo-horizontal.png"
            alt="Impulse CRM"
            width={1536}
            height={1024}
            priority
            className="h-16 w-16 scale-[1.65] object-cover object-center lg:h-24 lg:w-full lg:scale-125"
          />
        </Link>
      </div>

      <nav aria-label="Navegação principal" className="relative flex-1 space-y-1 overflow-y-auto px-2.5 py-5 lg:px-3">
        {sidebarMenu.map((item) => {
          const Icon = item.icon;
          const active = isRouteActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={item.title}
              className={`group flex min-h-11 items-center justify-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/80 lg:justify-start ${
                active
                  ? "border-blue-400/20 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-950/30"
                  : "border-transparent text-slate-300 hover:border-white/5 hover:bg-white/[0.07] hover:text-white"
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

      <div className="relative hidden border-t border-white/8 p-3 lg:block">
        <div className="rounded-xl border border-white/10 bg-white/[0.055] px-4 py-3 shadow-inner backdrop-blur-sm">
          <p className="text-sm font-semibold text-white">
            {user?.name ?? "Usuário"}
          </p>

          <p className="mt-0.5 text-xs text-slate-400">
            {user?.email ?? ""}
          </p>
        </div>
      </div>
    </aside>
  );
}
