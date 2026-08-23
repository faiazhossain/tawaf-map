import { NextRequest, NextResponse } from "next/server";
import { osrmLegsToSteps } from "@/lib/routing/osrm-instructions-bn";

/**
 * রাউটিং প্রক্সি — Barikoi v2 রুট API (OSRM-ধাঁচ)। কী সার্ভারেই থাকে,
 * ক্লায়েন্ট কখনো দেখে না; আপস্ট্রিমের ডোমেইন অ্যালাউলিস্টের জন্য Origin
 * হেডার পাঠাতে হয়।
 *
 * POST /api/directions
 *   { origin: [lon, lat], destination: [lon, lat], profile?: "foot"|"car"|"motorcycle"|"bicycle" }
 * রেসপন্স:
 *   { route: { geometry: [lon,lat][], distance, duration, steps } }
 *
 * env: BARIKOI_API_KEY (এই রিপোর রীতি) বা MAP_API_ACCESS_TOKEN (Barikoi
 * কনসোলের নাম) — যেকোনো একটি।
 */

const ROUTE_API = "https://barikoi.xyz/v2/api/route";
const PROFILES = new Set(["foot", "car", "motorcycle", "bicycle"]);
const REQUEST_TIMEOUT_MS = 10_000;

type Profile = "foot" | "car" | "motorcycle" | "bicycle";

interface DirectionsRequest {
  origin?: unknown;
  destination?: unknown;
  profile?: unknown;
}

function apiKey(): string | undefined {
  return process.env.BARIKOI_API_KEY ?? process.env.MAP_API_ACCESS_TOKEN ?? undefined;
}

function parseCoordinate(value: unknown, label: string): [number, number] {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    typeof value[0] !== "number" ||
    typeof value[1] !== "number" ||
    !Number.isFinite(value[0]) ||
    !Number.isFinite(value[1]) ||
    Math.abs(value[1]) > 90 ||
    Math.abs(value[0]) > 180
  ) {
    throw new Error(`অবৈধ ${label} স্থানাঙ্ক`);
  }
  return [value[0], value[1]];
}

export async function POST(request: NextRequest) {
  let body: DirectionsRequest;
  try {
    body = (await request.json()) as DirectionsRequest;
  } catch {
    return NextResponse.json({ error: "অবৈধ JSON অনুরোধ" }, { status: 400 });
  }

  let origin: [number, number];
  let destination: [number, number];
  try {
    origin = parseCoordinate(body.origin, "উৎসের");
    destination = parseCoordinate(body.destination, "গন্তব্যের");
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "অবৈধ অনুরোধ" },
      { status: 400 }
    );
  }

  // হাঁটার অ্যাপ — ডিফল্ট foot
  const profile: Profile =
    typeof body.profile === "string" && PROFILES.has(body.profile)
      ? (body.profile as Profile)
      : "foot";

  const key = apiKey();
  if (!key) {
    return NextResponse.json(
      { error: "রাউটিং কী সেট করা হয়নি — .env.local-এ BARIKOI_API_KEY যোগ করুন" },
      { status: 500 }
    );
  }

  // Barikoi OSRM-ধাঁচ: lng,lat জোড়া, পয়েন্টগুলো ';' দিয়ে জোড়া
  const coordinates = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
  const params = new URLSearchParams({
    api_key: key,
    geometries: "geojson",
    profile,
    steps: "true",
    alternatives: "false",
  });

  let upstream: Response;
  try {
    upstream = await fetch(`${ROUTE_API}/${coordinates}?${params.toString()}`, {
      headers: { Origin: "maps.barikoi.com" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return NextResponse.json(
      { error: "রাউটিং সার্ভারে পৌঁছানো যাচ্ছে না — কিছুক্ষণ পরে আবার চেষ্টা করুন" },
      { status: 502 }
    );
  }

  const data = (await upstream.json().catch(() => null)) as {
    code?: string;
    message?: string;
    routes?: Array<{
      distance?: number;
      duration?: number;
      geometry?: { coordinates?: number[][] };
      legs?: Array<{ steps?: never[] }>;
    }>;
  } | null;

  if (!upstream.ok || !data || data.code !== "Ok" || !data.routes?.length) {
    // NoRoute (বা Ok হয়েও ফাঁকা routes) মানে ইঞ্জিন সত্যিই হাঁটার পথ পায়নি —
    // ক্লায়েন্ট এই কোড দেখে আনুমানিক ডটেড রুটে পড়ে যায়, তাই সাধারণ
    // ব্যর্থতা (502) থেকে আলাদা করে `code`-সহ 422 ফেরানো হয়।
    if (upstream.ok && data && (data.code === "NoRoute" || data.code === "Ok")) {
      return NextResponse.json(
        { error: "এই দুই স্থানের মাঝে হাঁটার পথ পাওয়া যায়নি", code: "NoRoute" },
        { status: 422 }
      );
    }
    const detail =
      data?.message ?? (upstream.ok ? "পথ পাওয়া যায়নি" : `আপস্ট্রিম ${upstream.status}`);
    return NextResponse.json({ error: `পথ বের করা যায়নি: ${detail}` }, { status: 502 });
  }

  const route = data.routes[0];
  const coordinatesOut = route.geometry?.coordinates;
  if (!Array.isArray(coordinatesOut) || coordinatesOut.length < 2) {
    return NextResponse.json(
      { error: "এই দুই স্থানের মাঝে হাঁটার পথ পাওয়া যায়নি", code: "NoRoute" },
      { status: 422 }
    );
  }

  return NextResponse.json({
    route: {
      // GeoJSON LineString — [lon, lat] জোড়া, MapLibre-এর ক্রমেই
      geometry: coordinatesOut.map(([lon, lat]) => [lon, lat] as [number, number]),
      distance: route.distance ?? 0,
      // OSRM সময় সেকেন্ডে দেয়
      duration: Math.round(route.duration ?? 0),
      steps: osrmLegsToSteps(route.legs ?? []),
    },
  });
}
