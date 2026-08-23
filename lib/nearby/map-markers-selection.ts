import type { NearbyItem } from "@/types/nearby";

/**
 * মানচিত্রে কতগুলো "আমার কাছে" মার্কার দেখানো হবে তার বিশুদ্ধ নির্বাচন —
 * Airbnb-ধাঁচে ক্যাপ + নিকটতম-অগ্রাধিকার + স্ক্রিন-স্পেস ওভারল্যাপ স্কিপ।
 * মানচিত্র-নিরপেক্ষ: প্রজেকশন ইনজেক্ট করা হয়, তাই jsdom-এ পরীক্ষাযোগ্য।
 */

/** সর্বোচ্চ কতটি "আমার কাছে" মার্কার একসাথে দৃশ্যমান */
export const NEARBY_MAP_MARKER_CAP = 12;

/** নিকটতম কতটি মার্কার স্পন্দিত (emerald টিয়ার) */
export const NEARBY_MAP_PULSE_COUNT = 3;

/** স্পন্দিত মার্কারের ভিজ্যুয়াল বৃত্তের ব্যাসার্ধ (36px ভিজ্যুয়াল) */
export const NEARBY_MAP_PULSED_VISUAL_RADIUS_PX = 18;

/** সাধারণ (compact) মার্কারের ভিজ্যুয়াল বৃত্তের ব্যাসার্ধ (28px ভিজ্যুয়াল) */
export const NEARBY_MAP_COMPACT_VISUAL_RADIUS_PX = 14;

/** দুই মার্কারের ভিজ্যুয়াল ফুটপ্রিন্টের মধ্যে ন্যূনতম ফাঁক */
export const NEARBY_MAP_MARKER_SPACING_PX = 4;

/** ইনজেক্ট করা প্রজেকশনের ফল — maplibre-এর map.project() সমতুল্য */
export interface ScreenPoint {
  x: number;
  y: number;
}

/** রাখা হয়েছে এমন মার্কার — দূরত্ব-ক্রম ও স্পন্দন-অবস্থাসহ */
export interface NearbyMarkerPlacement {
  item: NearbyItem;
  /** kept-তালিকায় 1-ভিত্তিক দূরত্ব-ক্রম (1 = সবচেয়ে কাছে) */
  rank: number;
  /** সম্পূর্ণ তালিকার নিকটতম pulseCount-টির মধ্যে আছে কি না */
  pulsed: boolean;
}

export interface NearbyMarkerSelection {
  kept: NearbyMarkerPlacement[];
  /** পূর্ণ আইকন পায়নি এমন আইটেম (মানচিত্রে ছোট বিন্দু হয়), দূরত্ব-ক্রমে */
  skipped: NearbyItem[];
}

export interface SelectNearbyMapMarkersOptions {
  /** default NEARBY_MAP_MARKER_CAP */
  cap?: number;
  /** default NEARBY_MAP_PULSE_COUNT */
  pulseCount?: number;
  /** default NEARBY_MAP_MARKER_SPACING_PX */
  spacingPx?: number;
  /** cap/overlap উপেক্ষা করে সবসময় দৃশ্যমান — নির্বাচিত আইটেমের id */
  alwaysIncludeIds?: readonly string[];
}

export const EMPTY_NEARBY_MARKER_SELECTION: NearbyMarkerSelection = {
  kept: [],
  skipped: [],
};

interface PlacedMarker {
  point: ScreenPoint;
  radius: number;
}

/**
 * নির্বাচন অ্যালগরিদম (নিয়তিনির্ধারিত):
 * 1. দূরত্ব-ক্রমে স্থিতিশীল সাজানো (ইনপুট এমনিতেই সাজানো; ভিতরের সাজানো
 *    ফাংশনটিকে সম্পূর্ণ করে)।
 * 2. alwaysIncludeIds (নির্বাচিত আইটেম) আগে বসানো — cap/overlap বাইপাস,
 *    কিন্তু স্পন্দন পূর্ণ তালিকার ক্রম থেকে, তাই দূরের নির্বাচিত আইটেম
 *    কখনো স্পন্দিত হয় না।
 * 3. নিকটতম-প্রথম লোভী পাস: cap পূর্ণ হলে বাকি সবাই বাদ; ইতোমধ্যে-বসানো
 *    কোনো মার্কারের সাথে স্ক্রিন-স্পেস ফুটপ্রিন্ট ওভারল্যাপ করলে প্রার্থী বাদ।
 * 4. kept পুনরায় দূরত্ব-ক্রমে; rank = 1..n।
 *
 * নোট: সব kept মার্কারের বাইরের এলিমেন্ট 44px ও anchor "bottom", ভিজ্যুয়াল
 * বৃত্ত বক্সের কেন্দ্রে — তাই প্রতিটির ভিজ্যুয়াল-কেন্দ্র প্রজেক্টেড
 * বিন্দু থেকে একই অফসেটে, আর project() বিন্দুর দূরত্বই ভিজ্যুয়াল-কেন্দ্রের
 * দূরত্বের নির্ভুল প্রক্সি — anchor সংশোধন লাগে না। (বিন্দু-মার্কার anchor
 * "center"-এ বসলেও placement-গণিতে অংশ নেয় না, তাই এ নোট অটুট।)
 */
export function selectNearbyMapMarkers(
  items: readonly NearbyItem[],
  project: (item: NearbyItem) => ScreenPoint,
  options?: SelectNearbyMapMarkersOptions
): NearbyMarkerSelection {
  const cap = options?.cap ?? NEARBY_MAP_MARKER_CAP;
  const pulseCount = options?.pulseCount ?? NEARBY_MAP_PULSE_COUNT;
  const spacingPx = options?.spacingPx ?? NEARBY_MAP_MARKER_SPACING_PX;

  // 1. প্রতিরক্ষামূলক স্থিতিশীল সাজানো — সমান দূরত্বে ইনপুট-ক্রম বজায়।
  const sorted = [...items].sort((a, b) => a.distance - b.distance);
  if (sorted.length === 0) return EMPTY_NEARBY_MARKER_SELECTION;

  const forcedIds = new Set(options?.alwaysIncludeIds ?? []);
  const placed: PlacedMarker[] = [];
  const keptItems: { item: NearbyItem; pulsed: boolean }[] = [];
  const skipped: NearbyItem[] = [];
  let forcedPlaced = 0;

  const overlaps = (candidate: PlacedMarker): boolean =>
    placed.some((existing) => {
      const dx = candidate.point.x - existing.point.x;
      const dy = candidate.point.y - existing.point.y;
      const minDist = candidate.radius + existing.radius + spacingPx;
      return dx * dx + dy * dy < minDist * minDist;
    });

  // 2. বলপ্রয়োগ-অন্তর্ভুক্তি পাস — নির্বাচিত আইটেম আগে বসে (cap-এর বাইরে)।
  sorted.forEach((item, index) => {
    if (!forcedIds.has(item.id)) return;
    placed.push({ point: project(item), radius: NEARBY_MAP_PULSED_VISUAL_RADIUS_PX });
    keptItems.push({ item, pulsed: index < pulseCount });
    forcedPlaced += 1;
  });

  // 3. লোভী পাস — নিকটতম প্রথম; cap শুধু বলপ্রয়োগ-বহির্ভূত এন্ট্রির উপর।
  // বাদ-পড়া আইটেম লুকানো যায় না — মানচিত্রে ছোট বিন্দু হিসেবে থাকে।
  sorted.forEach((item, index) => {
    if (forcedIds.has(item.id)) return; // ধাপ ২-এ ইতোমধ্যে বসানো
    if (keptItems.length >= cap + forcedPlaced) {
      skipped.push(item);
      return;
    }
    const pulsed = index < pulseCount;
    const radius = pulsed
      ? NEARBY_MAP_PULSED_VISUAL_RADIUS_PX
      : NEARBY_MAP_COMPACT_VISUAL_RADIUS_PX;
    const candidate: PlacedMarker = { point: project(item), radius };
    if (overlaps(candidate)) {
      skipped.push(item);
      return;
    }
    placed.push(candidate);
    keptItems.push({ item, pulsed });
  });

  // 4. kept দূরত্ব-ক্রমে + rank বরাদ্দ।
  const kept: NearbyMarkerPlacement[] = keptItems
    .sort((a, b) => a.item.distance - b.item.distance)
    .map((entry, index) => ({
      item: entry.item,
      rank: index + 1,
      pulsed: entry.pulsed,
    }));

  return { kept, skipped };
}

/**
 * রেন্ডার-ইফেক্ট dep: kept-id সেট + স্পন্দন-টিয়ার + বাদ-পড়া (বিন্দু) id-এর
 * ক্রম-নিরপেক্ষ স্ট্রিং। শুধু ক্রম বদলালে (non-pulsed এদিক-ওদিক) সিগনেচার
 * অপরিবর্তিত — মার্কার পুনর্নির্মাণ হয় না; id-সেট, স্পন্দন-টিয়ার বা
 * বিন্দু-সদস্যতা বদলালে বদলায়।
 */
export function nearbySelectionSignature(selection: NearbyMarkerSelection): string {
  const keptPart = selection.kept
    .map((placement) => {
      if (placement.pulsed && placement.rank === 1) return `${placement.item.id}:p1`;
      if (placement.pulsed) return `${placement.item.id}:p2`;
      return placement.item.id;
    })
    .sort()
    .join("|");
  // skipped ইতোমধ্যে দূরত্ব-ক্রমে — নিয়তিনির্ধারিত, আলাদা সাজানো লাগে না।
  const skippedPart = selection.skipped.map((item) => item.id).join(",");
  return `${keptPart}||${skippedPart}`;
}
