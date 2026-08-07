import "./globals.css";

import DashboardLayout from "@/components/layout/DashboardLayout";
import BuildConsole from "@/components/layout/BuildConsole";

import { ToastProvider } from "@/components/ui/crm";

import { getBuildInformation } from "@/lib/build-information";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const build = getBuildInformation();

  return (
    <html lang="pt-BR">
      <body>
        <ToastProvider>
          <BuildConsole build={build} />

          <DashboardLayout build={build}>{children}</DashboardLayout>
        </ToastProvider>
      </body>
    </html>
  );
}
