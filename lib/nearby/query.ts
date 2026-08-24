import { getActiveGates } from "@/lib/gates/active";
import { NEARBY_HOTELS } from "@/lib/data/hotels";
import { TOURIST_PLACES } from "@/lib/data/tourist-places";
import { DEMO_POIS } from "@/lib/data/pois";
import {
  haversineDistance,
  calculateBearing,
  estimateWalkingTime,
  formatDistance,
  formatWalkingTime,
  getDirectionFromBearing,
} from "@/lib/utils/distance";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import type {
  NearbyCategory,
  NearbyCounts,
  NearbyItem,
  NearbyLiveFields,
  NearbyLiveTrend,
  NearbySource,
} from "@/types/nearby";
import type { Gate } from "@/types/gate";
import type { Hotel } from "@/types/hotel";
import type { TouristPlace } from "@/types/tourist-place";
import type { POI } from "@/types/poi";
import { DEFAULT_ENABLED_CATEGORIES, NEARBY_CATEGORY_IDS } from "@/lib/nearby/categories";

/**
 * "আমার কাছে" কোয়েরি লেয়া়ার — বিশুদ্ধ ফাংশন, React-নিরপেক্ষ, jsdom-এ পরীক্ষাযোগ্য।
 *
 * ডেটাসেট রেফারেন্স মডিউল স্কোপে ধরা হয় — demo-world যেমন `location.coordinates`
 * ইন-প্লেসে পুনঃনির্ধারণ করে, তেমন প্রতিটি কোয়েরিতে `source.location.coordinates`
 * পড়া হয় (কখনো কপি নয়), তাই অনুবাদিত এরিনার কোঅর্ডিনেটও ঠিকভাবে দেখা যায়।
 */

// ---------------------------------------------------------------------------
// উৎস-তালিকা
// ---------------------------------------------------------------------------

const MAKKAH_TOURIST_PLACES: TouristPlace[] = TOURIST_PLACES.filter(
  (place) => place.city === "makkah"
);

function sourcesForCategory(category: NearbyCategory): NearbySource[] {
  switch (category) {
    case "gate":
      return getActiveGates();
    case "hotel":
      return NEARBY_HOTELS;
    case "historical":
      return MAKKAH_TOURIST_PLACES;
    case "restaurant":
    case "cafe":
    case "toilet":
    case "atm":
    case "pharmacy":
    case "mosque":
      return DEMO_POIS.filter((poi) => poi.category === category);
  }
}

// ---------------------------------------------------------------------------
// সাবটাইটেল নির্মাণ
// ---------------------------------------------------------------------------

const GATE_TYPE_LABELS: Record<NonNullable<Gate["type"]>, string> = {
  king_fahd: "কিং ফাহদ সম্প্রসারণ",
  umrah: "ওমরাহ গেট",
  salah: "নামাজের গেট",
};

const TOURIST_CATEGORY_LABELS: Record<TouristPlace["category"], string> = {
  historical_site: "ঐতিহাসিক স্থান",
  museum: "জাদুঘর",
  mosque: "মসজিদ",
  park: "পার্ক",
  mountain: "পাহাড়",
  shopping: "কেনাকাটা",
  cultural_center: "সাংস্কৃতিক কেন্দ্র",
  landmark: "ল্যান্ডমার্ক",
  agriculture: "কৃষি এলাকা",
  religious_site: "ধর্মীয় স্থান",
  cemetery: "কবরস্থান",
};

const CUISINE_LABELS: Record<NonNullable<POI["cuisine"]>[number], string> = {
  arabic: "আরবি",
  south_asian: "দেশি",
  east_asian: "পূর্ব এশীয়",
  western: "পশ্চিমা",
  middle_eastern: "মধ্যপ্রাচ্য",
  african: "আফ্রিকান",
  other: "অন্যান্য",
};

/** প্রতিটি বিভাগের জন্য ছোট এক লাইনের বাংলা সাবটাইটেল */
export function nearbySubtitle(category: NearbyCategory, source: NearbySource): string {
  switch (category) {
    case "gate":
      return GATE_TYPE_LABELS[(source as Gate).type ?? "umrah"];
    case "hotel":
      return `${toBengaliNumber((source as Hotel).starRating)} তারা হোটেল`;
    case "historical":
      return TOURIST_CATEGORY_LABELS[(source as TouristPlace).category];
    case "restaurant":
    case "cafe": {
      const poi = source as POI;
      const parts: string[] = [];
      if (poi.cuisine?.length) {
        parts.push(CUISINE_LABELS[poi.cuisine[0]]);
      }
      if (poi.halal) {
        parts.push("হালাল");
      }
      return parts.join(" • ") || (category === "cafe" ? "ক্যাফে" : "রেস্টুরেন্ট");
    }
    case "toilet":
      return "পাবলিক টয়লেট";
    case "atm":
      return "এটিএম";
    case "pharmacy":
      return "ফার্মেসি";
    case "mosque":
      return "মসজিদ";
  }
}

// ---------------------------------------------------------------------------
// NearbyItem নির্মাণ
// ---------------------------------------------------------------------------

function displayName(category: NearbyCategory, source: NearbySource): string {
  if (category === "gate" || category === "hotel") {
    const record = source as Gate & { nameBn?: string };
    if (record.nameBn) return record.nameBn;
  }
  return source.name;
}

function ratingOf(category: NearbyCategory, source: NearbySource): number | undefined {
  if (category === "historical") return (source as TouristPlace).rating;
  if (category !== "gate" && category !== "hotel") return (source as POI).rating;
  return undefined;
}

function toItem(
  category: NearbyCategory,
  source: NearbySource,
  lat: number,
  lon: number
): NearbyItem {
  const [lng, sourceLat] = source.location.coordinates;
  const distance = haversineDistance(lat, lon, sourceLat, lng);
  const bearing = calculateBearing(lat, lon, sourceLat, lng);
  const walkingTime = estimateWalkingTime(distance);

  return {
    id: source.id,
    category,
    name: displayName(category, source),
    nameAr: source.nameAr,
    coordinates: source.location.coordinates,
    distance,
    distanceFormatted: formatDistance(distance),
    walkingTime,
    walkingTimeFormatted: formatWalkingTime(walkingTime),
    bearing,
    direction: getDirectionFromBearing(bearing),
    rating: ratingOf(category, source),
    subtitle: nearbySubtitle(category, source),
    source,
  };
}

// ---------------------------------------------------------------------------
// পাবলিক কোয়েরি
// ---------------------------------------------------------------------------

/**
 * "গেট খুঁজুন" সার্চ থেকে NearbyItem — ব্যাসার্ধ-কোয়েরির বাইরের (এমনকি ব্যবহারকারীর
 * ফিক্স ছাড়া বাছাই করা) গেটও ডিটেইল শিটে খোলা যায়। ফিক্স না থাকলে দূরত্ব-ফিল্ড
 * "—": distance অসীম, তাই no-fix ফলব্যাকে isNear মিথ্যা থাকে ও সাজানোর শেষে বসে।
 */
export function gateToNearbyItem(gate: Gate, lat: number | null, lon: number | null): NearbyItem {
  if (lat !== null && lon !== null) {
    return toItem("gate", gate, lat, lon);
  }
  return {
    id: gate.id,
    category: "gate",
    name: displayName("gate", gate),
    nameAr: gate.nameAr,
    coordinates: gate.location.coordinates,
    distance: Number.POSITIVE_INFINITY,
    distanceFormatted: "—",
    walkingTime: 0,
    walkingTimeFormatted: "—",
    bearing: 0,
    direction: "",
    rating: ratingOf("gate", gate),
    subtitle: nearbySubtitle("gate", gate),
    source: gate,
  };
}

export interface NearbyQueryOptions {
  /** কোন বিভাগ ধরা হবে (সেটিংসের ভিজিবিলিটি টগল); ডিফল্ট সব */
  enabledCategories?: NearbyCategory[];
  /** শুধু restaurant/cafe-এ প্রযোজ্য */
  halalOnly?: boolean;
}

function passesFilters(
  category: NearbyCategory,
  source: NearbySource,
  opts: NearbyQueryOptions
): boolean {
  if (opts.halalOnly && (category === "restaurant" || category === "cafe")) {
    return (source as POI).halal !== false;
  }
  return true;
}

/** এক বিভাগের ব্যাসার্ধের ভেতরের সব আইটেম, দূরত্ব অনুসারে সাজানো। */
export function getNearbyItems(
  category: NearbyCategory,
  lat: number,
  lon: number,
  radius: number,
  opts: NearbyQueryOptions = {}
): NearbyItem[] {
  return sourcesForCategory(category)
    .filter((source) => passesFilters(category, source, opts))
    .map((source) => toItem(category, source, lat, lon))
    .filter((item) => item.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
}

/** প্রতি বিভাগে ব্যাসার্ধের ভেতরে কতগুলো আইটেম (enabledCategories + halalOnly মানে)। */
export function getNearbyCounts(
  lat: number,
  lon: number,
  radius: number,
  opts: NearbyQueryOptions = {}
): NearbyCounts {
  const enabled = opts.enabledCategories ?? DEFAULT_ENABLED_CATEGORIES;
  const counts = {} as NearbyCounts;
  // সব বিভাগ শূন্য দিয়ে শুরু — disabled বিভাগে ০-ই থাকে
  for (const category of NEARBY_CATEGORY_IDS) {
    counts[category] = 0;
  }
  for (const category of enabled) {
    counts[category] = getNearbyItems(category, lat, lon, radius, opts).length;
  }
  return counts;
}

/**
 * মুভমেন্ট হিস্টেরেসিস: শেষ নির্গত ফিক্স থেকে নতুন ফিক্স minDeltaMeters-এর
 * কম দূরে হলে false — GPS জিটারে (~১ Hz ফিক্স) অকারণ রি-কম্পিউট বন্ধ।
 * প্রথম ফিক্স সবসময় true।
 */
export function shouldEmitPositionChange(
  prevLat: number | null,
  prevLon: number | null,
  lat: number,
  lon: number,
  minDeltaMeters = 10
): boolean {
  if (prevLat === null || prevLon === null) return true;
  return haversineDistance(prevLat, prevLon, lat, lon) >= minDeltaMeters;
}

// ---------------------------------------------------------------------------
// লাইভ দূরত্ব (ডিসপ্লে-টিয়ার)
// ---------------------------------------------------------------------------

/** ডিসপ্লে-টিয়ার নির্গমন সীমা — কাঠামোগত ১০ মি-র চেয়ে সূক্ষ্ম, শুধু লেখা বদলায় */
export const NEARBY_LIVE_MIN_DELTA_M = 2;
/** ট্রেন্ড-ফ্লিপের ডেডব্যান্ড — GPS জিটারে "কাছে/দূরে" বারবার বদলানো বন্ধ */
export const NEARBY_TREND_DEADBAND_M = 3;
/** "প্রায় পৌঁছে গেছেন" অবস্থার দূরত্ব-সীমা */
export const NEARBY_NEAR_THRESHOLD_M = 50;

/**
 * স্ন্যাপশট নির্বিশেষে আইটেমের কোঅর্ডিনেট থেকে বর্তমান ফিক্সে লাইভ ফিল্ড —
 * toItem-এর একই গণিত, কিন্তু ব্যাসার্ধ/তালিকা-সদস্যতা থেকে স্বাধীন (তাই
 * ডিটেইল শিট খোলা থাকাকালীন আইটেম ব্যাসার্ধ ছাড়িয়ে গেলেও দূরত্ব বাড়তে থাকে)।
 */
export function nearbyLiveFields(
  coordinates: [number, number],
  lat: number,
  lon: number
): NearbyLiveFields {
  const [lng, sourceLat] = coordinates;
  const distance = haversineDistance(lat, lon, sourceLat, lng);
  const bearing = calculateBearing(lat, lon, sourceLat, lng);
  const walkingTime = estimateWalkingTime(distance);

  return {
    distance,
    distanceFormatted: formatDistance(distance),
    walkingTime,
    walkingTimeFormatted: formatWalkingTime(walkingTime),
    bearing,
    direction: getDirectionFromBearing(bearing),
  };
}

/**
 * ডেডব্যান্ডসহ ট্রেন্ড — শেষ "নোঙর" দূরত্ব থেকে নতুন দূরত্ব deadbandMeters-এর
 * বেশি কমলে "closer", বাড়লে "farther"; সীমার ভেতরে আগের ট্রেন্ডই থাকে (জিটারে
 * ফ্লিপ-ফ্লপ বন্ধ)। anchor null হলে প্রথম নোঙর বসে, ট্রেন্ড এখনো null।
 */
export function nextDistanceTrend(
  previousTrend: NearbyLiveTrend,
  anchorDistance: number | null,
  distance: number,
  deadbandMeters: number
): { trend: NearbyLiveTrend; anchor: number } {
  if (anchorDistance === null) {
    return { trend: null, anchor: distance };
  }
  if (distance < anchorDistance - deadbandMeters) {
    return { trend: "closer", anchor: distance };
  }
  if (distance > anchorDistance + deadbandMeters) {
    return { trend: "farther", anchor: distance };
  }
  return { trend: previousTrend, anchor: anchorDistance };
}

/** fitBounds-এর জন্য ব্যবহারকারী ± ব্যাসার্ধের বাউন্ডিং বক্স [[west, south], [east, north]]। */
export function nearbyRadiusBounds(
  lat: number,
  lon: number,
  radiusMeters: number
): [[number, number], [number, number]] {
  const latDelta = radiusMeters / 111320;
  const lonDelta = radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180));
  return [
    [lon - lonDelta, lat - latDelta],
    [lon + lonDelta, lat + latDelta],
  ];
}
