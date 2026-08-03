"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronLeft,
  FileText,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Settings,
  UserRoundCog,
  Users,
  X,
} from "lucide-react";
const styles = {
  sidebar: "impulse-sidebar",
  collapsed: "impulse-collapsed",
  brandRow: "impulse-brandRow",
  brand: "impulse-brand",
  brandMark: "impulse-brandMark",
  brandCopy: "impulse-brandCopy",
  userCopy: "impulse-userCopy",
  navigation: "impulse-navigation",
  navItem: "impulse-navItem",
  navIcon: "impulse-navIcon",
  active: "impulse-active",
  activeRail: "impulse-activeRail",
  footer: "impulse-footer",
  userCard: "impulse-userCard",
  avatar: "impulse-avatar",
  collapseButton: "impulse-collapseButton",
  navLabel: "impulse-navLabel",
  mobileClose: "impulse-mobileClose",
  backdrop: "impulse-backdrop",
  backdropVisible: "impulse-backdropVisible",
  mobileOpen: "impulse-mobileOpen"
};

export const sidebarMenu = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Leads", href: "/leads", icon: Users },
  { title: "Campanhas", href: "/campaigns", icon: Megaphone },
  { title: "WhatsApp", href: "/whatsapp", icon: MessageCircle },
  { title: "Templates", href: "/templates", icon: FileText },
  { title: "Corretores", href: "/agents", icon: UserRoundCog },
  { title: "Usuários", href: "/users", icon: Users },
  { title: "Relatórios", href: "/reports", icon: BarChart3 },
  { title: "Configurações", href: "/settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapse: () => void;
  onCloseMobile: () => void;
}

export default function Sidebar({ collapsed, mobileOpen, onCollapse, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        aria-label="Fechar menu lateral"
        className={`${styles.backdrop} ${mobileOpen ? styles.backdropVisible : ""}`}
        onClick={onCloseMobile}
      />
      <aside
        id="primary-sidebar"
        aria-label="Navegação principal"
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${mobileOpen ? styles.mobileOpen : ""}`}
      >
        <div className={styles.brandRow}>
          <Link
            href="/dashboard"
            className={styles.brand}
            aria-label="Impulse CRM — ir para o Dashboard"
            onClick={onCloseMobile}
          >
            <span className={styles.brandMark} aria-hidden="true">🚀</span>
            <span className={styles.brandCopy}>
              <strong>Impulse CRM</strong>
              <small>Inteligência comercial</small>
            </span>
          </Link>
          <button type="button" className={styles.mobileClose} onClick={onCloseMobile} aria-label="Fechar menu">
            <X aria-hidden="true" />
          </button>
        </div>

        <nav className={styles.navigation} aria-label="Menu principal">
          {sidebarMenu.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={collapsed ? item.title : undefined}
                data-tooltip={item.title}
                className={`${styles.navItem} ${active ? styles.active : ""}`}
                onClick={onCloseMobile}
              >
                <span className={styles.activeRail} aria-hidden="true" />
                <Icon className={styles.navIcon} aria-hidden="true" />
                <span className={styles.navLabel}>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <div className={styles.userCard} title={collapsed ? "Rodrigo Lopes — Superintendência" : undefined}>
            <span className={styles.avatar} aria-hidden="true">RL</span>
            <span className={styles.userCopy}>
              <strong>Rodrigo Lopes</strong>
              <small>Superintendência</small>
            </span>
          </div>
          <button
            type="button"
            className={styles.collapseButton}
            onClick={onCollapse}
            aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
            aria-expanded={!collapsed}
          >
            <ChevronLeft aria-hidden="true" />
            <span>{collapsed ? "Expandir" : "Recolher menu"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
