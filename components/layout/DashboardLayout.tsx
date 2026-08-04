"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AuthBoundary from "@/components/auth/AuthBoundary";
import type { BuildInformation } from "@/lib/build-information";

interface DashboardLayoutProps {
  children: ReactNode;
  build: BuildInformation;
}

export default function DashboardLayout({
  children,
  build,
}: DashboardLayoutProps) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <AuthBoundary>{children}</AuthBoundary>;
  }

  return <AuthBoundary>
    <div className="flex h-dvh bg-[radial-gradient(circle_at_top_right,_#eff6ff_0,_#f8fafc_32%,_#f1f5f9_100%)]">
      <Sidebar build={build} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 xl:px-8 xl:py-7">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  </AuthBoundary>;
}
