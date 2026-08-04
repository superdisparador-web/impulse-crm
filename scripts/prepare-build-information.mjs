import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync,writeFileSync } from "node:fs";
const git=(...args)=>execFileSync("git",args,{encoding:"utf8"}).trim();
const commit=process.env.IMPULSE_COMMIT||git("rev-parse","HEAD"),branch=process.env.IMPULSE_BRANCH||git("rev-parse","--abbrev-ref","HEAD"),buildDate=process.env.IMPULSE_BUILD_DATE||new Date().toISOString();
const buildId=process.env.IMPULSE_BUILD_ID||`${commit.slice(0,12)}-${Date.parse(buildDate).toString(36)}-${randomUUID().slice(0,8)}`;
const frontendVersion=JSON.parse(readFileSync(new URL("../package.json",import.meta.url),"utf8")).version,backendVersion=JSON.parse(readFileSync(new URL("../backend/package.json",import.meta.url),"utf8")).version;
writeFileSync(new URL("../.impulse-build.json",import.meta.url),`${JSON.stringify({commit,branch,buildDate,buildId,frontendVersion,backendVersion},null,2)}\n`);
console.log(`Impulse CRM build ${buildId} (${commit.slice(0,7)} ${branch})`);
