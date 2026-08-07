import { getBuildInformation } from "@/lib/build-information";

export const dynamic = "force-dynamic";
export async function GET() {
  const started = process.uptime(),
    memory = process.memoryUsage(),
    cpu = process.cpuUsage();
  let database: { status: "up" | "down"; latencyMs?: number; detail?: string } =
    { status: "down", detail: "Backend indisponível" };
  try {
    const before = performance.now(),
      response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/health`,
        { cache: "no-store", signal: AbortSignal.timeout(3000) },
      ),
      payload = (await response.json()) as { database?: typeof database };
    database = payload.database || {
      status: response.ok ? "up" : "down",
      latencyMs: Math.round(performance.now() - before),
    };
  } catch (error) {
    database = {
      status: "down",
      detail: error instanceof Error ? error.message : "Falha desconhecida",
    };
  }
  const healthy = database.status === "up";
  return Response.json(
    {
      status: healthy ? "up" : "degraded",
      uptime: started,
      memory: {
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
      },
      cpu: { userMicros: cpu.user, systemMicros: cpu.system },
      database,
      version: getBuildInformation(),
    },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
