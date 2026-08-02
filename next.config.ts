import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
type CapturedBuild={commit:string;branch:string;buildDate:string;buildId:string;frontendVersion:string;backendVersion:string};
const captured=JSON.parse(readFileSync(new URL("./.impulse-build.json",import.meta.url),"utf8")) as CapturedBuild;

const nextConfig: NextConfig = {
  env:{IMPULSE_COMMIT:captured.commit,IMPULSE_BRANCH:captured.branch,IMPULSE_BUILD_DATE:captured.buildDate,IMPULSE_BUILD_ID:captured.buildId,IMPULSE_FRONTEND_VERSION:captured.frontendVersion,IMPULSE_BACKEND_VERSION:captured.backendVersion},
  generateBuildId:async()=>captured.buildId,
};

export default nextConfig;
