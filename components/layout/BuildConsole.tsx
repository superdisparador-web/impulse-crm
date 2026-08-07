"use client";
import { useEffect } from "react";
import type { BuildInformation } from "@/lib/build-information";

export default function BuildConsole({ build }: { build: BuildInformation }) {
  useEffect(() => {
    console.info(
      `Impulse CRM\nCommit: ${build.commit}\nBranch: ${build.branch}\nBuild: ${build.buildDate}\nBuild ID: ${build.buildId}`,
    );
  }, [build]);
  return null;
}
