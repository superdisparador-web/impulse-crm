import { getBuildInformation } from "@/lib/build-information";

export const dynamic="force-dynamic";
export function GET(){return Response.json(getBuildInformation(),{headers:{"Cache-Control":"no-store"}})}
