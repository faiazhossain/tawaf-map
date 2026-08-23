/**
 * গন্তব্যের "শেষ ধাপ" — Barikoi/OSRM গন্তব্যকে কাছের রাস্তায় স্ন্যাপ করে
 * দেয়, তাই রুটের জ্যামিতি প্রায়ই প্রকৃত গন্তব্যের আগে, রাস্তায় শেষ হয়।
 * এই মডিউল দুটি জিনিস বানায়:
 *
 * 1. buildApproach — রাস্তার শেষ বিন্দু থেকে প্রকৃত গন্তব্য পর্যন্ত বাঁকা
 *    ডটেড সংযোগকারী (Google-এর "বাকি পথ হেঁটে যান"-এর মতো)।
 * 2. buildApproximateRoute — পথই না পাওয়া গেলে পুরো ট্রিপের আনুমানিক
 *    সরলরেখা-রুট, যা একই ডটেড ভিজ্যুয়াল ভাষায় আঁকা হয়।
 */

import { curvedArc } from "@/lib/geo/curve";
import { haversineDistance, estimateWalkingTime } from "@/lib/utils/distance";
import type { Route, RouteApproach } from "@/types/navigation";

/**
 * রুটের শেষ বিন্দু ও গন্তব্যের ফাঁক এর চেয়ে কম হলে সংযোগকারী আঁকা হয়
 * না — ছোট স্ন্যাপ-ফাঁকে ডট আঁকা নয়। (ARRIVAL_RADIUS_M-এর চেয়ে ছোট
 * রাখা হয়েছে যাতে নতুন কোনো অবস্থার জন্ম না নেয়।)
 */
export const APPROACH_MIN_GAP_M = 15;

/**
 * রুটের শেষ ভার্টেক্স থেকে প্রকৃত গন্তব্য পর্যন্ত বাঁকা সংযোগকারী।
 * ফাঁক APPROACH_MIN_GAP_M-এর কম হলে null।
 */
export function buildApproach(
  geometry: number[][],
  destination: [number, number]
): RouteApproach | null {
  const last = geometry[geometry.length - 1];
  if (!last) return null;

  const gapM = haversineDistance(last[1], last[0], destination[1], destination[0]);
  if (gapM < APPROACH_MIN_GAP_M) return null;

  return curvedArc([last[0], last[1]], destination);
}

/**
 * পথ না পাওয়া গেলে পুরো ট্রিপের আনুমানিক রুট — উৎস থেকে গন্তব্য পর্যন্ত
 * একটাই বাঁকা চাপ, একটাই নির্দেশনা। `approximate: true` ফ্ল্যাগে নেভিগেশন
 * জানে এই রুটে কখনো রিয়ারাউট করা যাবে না।
 */
export function buildApproximateRoute(
  origin: [number, number],
  destination: [number, number]
): Route {
  const arc = curvedArc(origin, destination);
  return {
    id: `route-approx-${Date.now()}`,
    geometry: arc.geometry,
    distance: arc.distance,
    duration: estimateWalkingTime(arc.distance),
    steps: [
      {
        instruction: "গন্তব্যের দিকে সোজা হেঁটে যান",
        distance: arc.distance,
        duration: estimateWalkingTime(arc.distance),
        maneuver: "arrive",
      },
    ],
    approach: null,
    approximate: true,
  };
}
