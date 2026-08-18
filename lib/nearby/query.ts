import { HARAM_GATES } from "@/lib/data/gates";
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
import type { NearbyCategory, NearbyCounts, NearbyItem, NearbySource } from "@/types/nearby";
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
      return HARAM_GATES;
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

const GATE_TYPE_LABELS: Record<Gate["type"], string> = {
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
      return GATE_TYPE_LABELS[(source as Gate).type];
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
