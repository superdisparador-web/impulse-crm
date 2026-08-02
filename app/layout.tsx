import "./globals.css";
import DashboardLayout from "@/components/layout/DashboardLayout";
import BuildConsole from "@/components/layout/BuildConsole";
import { getBuildInformation } from "@/lib/build-information";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const build=getBuildInformation();
  return (
    <html lang="pt-BR">
      <body>
        <BuildConsole build={build}/>
        <DashboardLayout build={build}>
          {children}
        </DashboardLayout>
      </body>
    </html>
  );
}
