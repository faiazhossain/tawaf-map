/**
 * রুট প্রগ্রেস ইঞ্জিন — বিশুদ্ধ ফাংশন, কোনো React/ম্যাপ নির্ভরতা নেই।
 *
 * প্রতিটি GPS ফিক্সকে সক্রিয় রুটের পলিলাইনে অভিক্ষেপ (projection) করে
 * বলে: ব্যবহারকারী রুটের কত দূরে, কতটা পথ পেরিয়েছে, এখন কোন ধাপে
 * (step) আছে, আর গন্তব্যে পৌঁছানো হয়েছে কি না। অফ-রুট সনাক্তকরণে
 * হিস্টেরিসিস আছে যাতে GPS জিটার কখনো ভুল রিয়ারাউট ট্রিগার না করে।
 */

import { projectPointToSegment, offsetToLngLat, metersOffset, type LngLat } from "@/lib/geo/plane";
import { haversineDistance, estimateWalkingTime } from "@/lib/utils/distance";
import type { RouteStep } from "@/types/navigation";

// ---------------------------------------------------------------------------
// থ্রেশহোল্ড ধ্রুবক (টেস্ট ও ভোক্তার জন্য এক্সপোর্টকৃত)
// ---------------------------------------------------------------------------

/** রুট থেকে এত মিটার বা তার বেশি দূরের ফিক্স "অফ-রুট" হিসেবে গণ্য হয়। */
export const OFF_ROUTE_ENTER_M = 30;

/** এত মিটারের ভিতরে ফিরলে অফ-রুট গণনা রিসেট হয় (২০-৩০ মি হিস্টেরিসিস ব্যান্ড)। */
export const OFF_ROUTE_EXIT_M = 20;

/** টানা এতটি অফ-রুট ফিক্সের পরেই রিয়ারাউট সিদ্ধান্ত (হাঁটার গতিতে ~৩-৬ সেকেন্ড)। */
export const OFF_ROUTE_SUSTAINED_FIXES = 3;

/** গন্তব্যের এত মিটারের মধ্যে এলে "পৌঁছেছেন" (OSRM গন্তব্য-স্ন্যাপ ঢেকে দেয়)। */
export const ARRIVAL_RADIUS_M = 20;

/** এর চেয়ে খারাপ accuracy-র ফিক্স পুরোপুরি উপেক্ষিত — ভুল তথ্য নয়, বরং থেমে থাকা। */
export const MAX_FIX_ACCURACY_M = 50;

// ---------------------------------------------------------------------------
// সেগমেন্ট মাপ
// ---------------------------------------------------------------------------

/** দুই বিন্দুর স্থানীয়-সমতল দূরত্ব, মিটারে। */
function segmentLengthMeters(a: LngLat, b: LngLat): number {
  const offset = metersOffset(a, b);
  return Math.hypot(offset.east, offset.north);
}

function toLngLat(point: number[] | [number, number]): LngLat {
  return { lng: point[0], lat: point[1] };
}

// ---------------------------------------------------------------------------
// পলিলাইনে অবস্থান
// ---------------------------------------------------------------------------

export interface SnappedPosition {
  /** পলিলাইনের ওপর সবচেয়ে কাছের বিন্দু [lng, lat] */
  snapped: [number, number];
  /** যে সেগমেন্টের শুরু-ভার্টেক্সে অভিক্ষেপ পড়েছে তার ইনডেক্স */
  segmentIndex: number;
  /** সেই সেগমেন্টের ওপর ভগ্নাংশ (০..১) */
  segmentFraction: number;
  /** রুটের শুরু থেকে মিটারে দূরত্ব */
  distanceAlongRoute: number;
  /** পলিলাইন থেকে লম্ব দূরত্ব, মিটারে */
  distanceFromRoute: number;
}

/** পলিলাইনের মোট দৈর্ঘ্য, মিটারে — সেগমেন্ট-দৈর্ঘ্যের যোগফল (রুট ধরে, সরলরেখা নয়)। */
export function totalPolylineDistance(geometry: number[][]): number {
  let total = 0;
  for (let i = 0; i < geometry.length - 1; i++) {
    total += segmentLengthMeters(toLngLat(geometry[i]), toLngLat(geometry[i + 1]));
  }
  return total;
}

/**
 * পুরো পলিলাইনে সবচেয়ে কাছের সেগমেন্ট-অভিক্ষেপ। জ্যামিতিতে ২টির কম
 * বিন্দু থাকলে থ্রো করে (কলারের দায়িত্ব আগেই গার্ড করা)।
 */
export function locateOnPolyline(geometry: number[][], point: [number, number]): SnappedPosition {
  if (geometry.length < 2) {
    throw new Error("locateOnPolyline requires at least two geometry points");
  }

  const p = toLngLat(point);

  let bestIndex = 0;
  let bestDistanceSq = Infinity;
  let bestOffset = { east: 0, north: 0 };
  let bestFraction = 0;
  let distanceBeforeBest = 0;

  let cumulative = 0;
  for (let i = 0; i < geometry.length - 1; i++) {
    const a = toLngLat(geometry[i]);
    const b = toLngLat(geometry[i + 1]);
    const projection = projectPointToSegment(p, a, b);

    if (projection.distanceSq < bestDistanceSq) {
      bestDistanceSq = projection.distanceSq;
      bestIndex = i;
      bestOffset = { east: projection.east, north: projection.north };
      bestFraction = projection.t;
      distanceBeforeBest = cumulative;
    }

    cumulative += segmentLengthMeters(a, b);
  }

  const snapped = offsetToLngLat(toLngLat(geometry[bestIndex]), bestOffset.east, bestOffset.north);

  return {
    snapped,
    segmentIndex: bestIndex,
    segmentFraction: bestFraction,
    distanceAlongRoute: distanceBeforeBest + Math.hypot(bestOffset.east, bestOffset.north),
    distanceFromRoute: Math.sqrt(bestDistanceSq),
  };
}

// ---------------------------------------------------------------------------
// ধাপ (step) অগ্রগতি
// ---------------------------------------------------------------------------

/**
 * ধাপ-শেষ সীমানার ক্রমসঞ্চিত দূরত্ব, মিটারে। OSRM-এর ধাপ-দূরত্বের যোগফল
 * রুটের মোট দূরত্বের সাথে প্রায়ই হুবহু মেলে না, তাই সীমানাগুলো স্কেল
 * করা হয় যাতে শেষটা ঠিক `totalDistance`-এ শেষ হয়। ফাঁকা/শূন্য-যোগফল
 * steps হলে `[totalDistance]` — ইনডেক্স সবসময় ০-তে থাকে, ক্র্যাশ নয়।
 */
export function buildStepBoundaries(steps: RouteStep[], totalDistance: number): number[] {
  if (steps.length === 0) return [totalDistance];

  const distances = steps.map((step) => (step.distance > 0 ? step.distance : 0));
  const stepSum = distances.reduce((sum, d) => sum + d, 0);
  if (stepSum <= 0) return [totalDistance];

  const scale = totalDistance / stepSum;
  const boundaries: number[] = [];
  let cumulative = 0;
  for (const d of distances) {
    cumulative += d * scale;
    boundaries.push(cumulative);
  }
  // ভাসমান-পয়েন্ট জমা যাতে ঠিক করে শেষ সীমানা = মোট দূরত্ব।
  boundaries[boundaries.length - 1] = totalDistance;
  return boundaries;
}

/** দূরত্ব-বরাবর অবস্থান থেকে বর্তমান ধাপের ইনডেক্স — কখনো `minStepIndex`-এর নিচে নামে না। */
export function stepIndexForDistance(
  boundaries: number[],
  distanceAlong: number,
  minStepIndex: number
): number {
  let index = 0;
  while (index < boundaries.length - 1 && distanceAlong >= boundaries[index]) {
    index++;
  }
  return Math.max(index, minStepIndex);
}

// ---------------------------------------------------------------------------
// অফ-রুট স্টেট মেশিন
// ---------------------------------------------------------------------------

export interface OffRouteCounters {
  consecutive: number;
  sustained: boolean;
}

export interface OffRouteOptions {
  enterM?: number;
  exitM?: number;
  sustainedFixes?: number;
}

/**
 * পরবর্তী অফ-রুট গণনা: >= enterM হলে গণনা বাড়ে, <= exitM হলে রিসেট,
 * দুয়ের মাঝের ব্যান্ডে আগের অবস্থা বহাল থাকে — সীমানার কাছে দোদুল্যমান
 * জিটার কখনো জমতে পারে না, তাই মিথ্যা রিয়ারাউট হয় না।
 */
export function nextOffRouteCounters(
  prev: OffRouteCounters,
  distanceFromRoute: number,
  options: OffRouteOptions = {}
): OffRouteCounters {
  const enterM = options.enterM ?? OFF_ROUTE_ENTER_M;
  const exitM = options.exitM ?? OFF_ROUTE_EXIT_M;
  const sustainedFixes = options.sustainedFixes ?? OFF_ROUTE_SUSTAINED_FIXES;

  if (distanceFromRoute >= enterM) {
    const consecutive = prev.consecutive + 1;
    return { consecutive, sustained: consecutive >= sustainedFixes };
  }
  if (distanceFromRoute <= exitM) {
    return { consecutive: 0, sustained: false };
  }
  return prev;
}

// ---------------------------------------------------------------------------
// প্রগ্রেস স্ন্যাপশট
// ---------------------------------------------------------------------------

export interface RouteProgressInput {
  geometry: number[][];
  steps: RouteStep[];
  /** কাঁচা GPS ফিক্স [lng, lat] */
  point: [number, number];
  /** গন্তব্য [lng, lat]; null হলে আগমন-পরীক্ষা বন্ধ থাকে */
  destination: [number, number] | null;
  /** একমুখী ক্ল্যাম্প — আগের currentStepIndex (ঐচ্ছিক) */
  minStepIndex?: number;
}

export interface RouteProgress {
  snapped: [number, number];
  distanceAlongRoute: number;
  distanceFromRoute: number;
  currentStepIndex: number;
  /** বর্তমান ধাপের ম্যানুভার বিন্দু পর্যন্ত মিটারে দূরত্ব (শেষ ধাপে পুরো অবশিষ্ট) */
  distanceToStepEnd: number;
  /** রুট ধরে মোট অবশিষ্ট দূরত্ব, মিটারে (সরলরেখা নয়) */
  remainingDistance: number;
  /** estimateWalkingTime(remainingDistance) — অ্যাপজুড়ে প্রচলিত ১.৩৯ মি/সে */
  remainingDuration: number;
  /** [snapped, ...geometry-র বাকি অংশ] — ভ্রমণকৃত অংশ বাদ দিয়ে */
  remainingGeometry: number[][];
  /** haversine(কাঁচা ফিক্স -> গন্তব্য) <= ARRIVAL_RADIUS_M */
  hasArrived: boolean;
}

/** এক ফিক্সের জন্য সম্পূর্ণ প্রগ্রেস হিসাব। */
export function computeRouteProgress(input: RouteProgressInput): RouteProgress {
  const { geometry, steps, point, destination, minStepIndex = 0 } = input;

  const located = locateOnPolyline(geometry, point);
  const totalDistance = totalPolylineDistance(geometry);
  const boundaries = buildStepBoundaries(steps, totalDistance);

  const currentStepIndex = stepIndexForDistance(
    boundaries,
    located.distanceAlongRoute,
    minStepIndex
  );

  const remainingDistance = Math.max(0, totalDistance - located.distanceAlongRoute);
  const stepEnd = boundaries[Math.min(currentStepIndex, boundaries.length - 1)];
  const distanceToStepEnd = Math.max(0, stepEnd - located.distanceAlongRoute);

  const hasArrived =
    destination !== null &&
    haversineDistance(point[1], point[0], destination[1], destination[0]) <= ARRIVAL_RADIUS_M;

  return {
    snapped: located.snapped,
    distanceAlongRoute: located.distanceAlongRoute,
    distanceFromRoute: located.distanceFromRoute,
    currentStepIndex,
    distanceToStepEnd,
    remainingDistance,
    remainingDuration: estimateWalkingTime(remainingDistance),
    remainingGeometry: sliceRemainingGeometry(geometry, located),
    hasArrived,
  };
}

/** স্ন্যাপড বিন্দু থেকে রুটের বাকি জ্যামিতি (রেন্ডার/টেস্টে আলাদাভাবে ব্যবহৃত)। */
export function sliceRemainingGeometry(geometry: number[][], snapped: SnappedPosition): number[][] {
  const tail = geometry.slice(snapped.segmentIndex + 1);
  if (tail.length === 0) return [snapped.snapped];
  // সেগমেন্টের শেষ ভার্টেক্সেই দাঁড়িয়ে থাকলে snapped পরের ভার্টেক্সেরই সমান —
  // ডুপ্লিকেট পয়েন্ট এড়াতে শুধু tail ফেরানো হয়।
  if (snapped.segmentFraction >= 0.999) return tail;
  return [snapped.snapped, ...tail];
}
