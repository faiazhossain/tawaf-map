import { NextRequest, NextResponse } from "next/server";
import { version } from "@/package.json";

/**
 * Health endpoint (OBS-001)। দুই স্তরের চেক —
 *
 * - ডিফল্ট (`GET /api/health`): শুধু লোকাল অবস্থা। আপস্ট্রিমকে ধোঁয়া না দিয়ে
 *   প্রতি-মিনিট pinger এটি ব্যবহার করতে পারে; body-র `degraded` flag দিয়ে
 *   কনফিগ-ড্রিফট (key নেই ইত্যাদি) ধরা যায়।
 * - ডিপ (`GET /api/health?deep=1`): Barikoi origin ও style endpoint-কে ৩s
 *   timeout-এ ছুঁয়ে দেখে — incident debug-এর জন্য, pinger-এর জন্য নয়।
 *
 * Liveness-এর জন্য রেসপন্স সবসময় 200: মনিটর text/body পার্স না করলেও ভুল
 * alert হবে না, আর যেটা পার্স করবে সে আরও ভালো সংকেত পায়।
 */

const BARIKOI_ORIGIN = "https://barikoi.xyz";
const DEEP_TIMEOUT_MS = 3_000;

function routingKeyPresent(): boolean {
  return Boolean(process.env.BARIKOI_API_KEY ?? process.env.MAP_API_ACCESS_TOKEN);
}

/** Reachability probe that never throws; returns a short machine-readable verdict. */
async function probe(
  url: string,
  init?: RequestInit
): Promise<"reachable" | "unreachable" | `upstream-${number}`> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(DEEP_TIMEOUT_MS), ...init });
    return res.status < 500 ? "reachable" : `upstream-${res.status}`;
  } catch {
    return "unreachable";
  }
}

export async function GET(request: NextRequest) {
  const styleKey = process.env.NEXT_PUBLIC_BARIKOI_API_KEY;
  const modelUpstream = process.env.MODEL_UPSTREAM_URL ?? "(default: raw.githubusercontent.com)";

  const degraded = !routingKeyPresent() || !styleKey;

  const checks: Record<string, unknown> = {
    barikoiRoutingKey: routingKeyPresent(),
    barikoiStyleKey: Boolean(styleKey),
    modelUpstream,
  };

  let deep: Record<string, unknown> | undefined;
  if (request.nextUrl.searchParams.get("deep") === "1") {
    const [barikoiOrigin, styleEndpoint] = await Promise.all([
      probe(BARIKOI_ORIGIN),
      styleKey
        ? probe(`https://map.barikoi.com/styles/osm_barikoi_pl/style.json?key=${styleKey}`, {
            method: "HEAD",
          })
        : Promise.resolve("skipped-no-key"),
    ]);
    deep = { barikoiOrigin, styleEndpoint };
  }

  return NextResponse.json({
    status: "ok",
    version,
    uptimeS: Math.round(process.uptime()),
    degraded,
    checks,
    ...(deep ? { deep } : {}),
  });
}
