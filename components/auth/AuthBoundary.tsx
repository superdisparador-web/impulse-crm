"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSession } from "@/services/session";

export default function AuthBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const publicRoute = pathname === "/login";
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (publicRoute && session) {
      router.replace("/dashboard");
      return;
    }
    if (!publicRoute && !session) {
      router.replace("/login");
      return;
    }
    const timeout = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(timeout);
  }, [publicRoute, router]);

  if (!ready) return null;
  return children;
}
