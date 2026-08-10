import { haversineDistance } from "@/lib/utils/distance";
import { getAnchorById } from "@/lib/data/umrah/anchors";
import type { RitualAnchor } from "@/types/umrah";

export interface LandmarkHintData {
  title: string;
  description: string;
  anchorName?: string;
}

const LANDMARK_HINTS: Record<string, LandmarkHintData> = {
  tawaf: {
    title: "তওয়াফ শুরু করতে কালো পাথর লক্ষ্য রাখুন",
    description:
      "প্রতিটি চক্কর শুরুতে হাজরে আসওয়াদ থেকে শুরু করুন; ১মত শুরু হলে চলার দিকটি ঘড়ির বিপরীত।",
    anchorName: "হাজরে আসওয়াদ",
  },
  "tawaf-corner": {
    title: "ইয়েমেনি কোণার কাছে আসলে স্পর্শ করুন",
    description: "চক্করের মাঝেমধ্যে রুকনে ইয়ামানি স্পর্শ করুন, কিন্তু চুম্বন বা তাকবীর করবেন না।",
    anchorName: "রুকনে ইয়ামানি",
  },
  "pray-after-tawaf": {
    title: "মাকামে ইবরাহিমে নামাজ ও যমযম",
    description: "তওয়াফের পরে মাকামে ইবরাহিমে দুই রাকাত নামাজ পড়ুন এবং তারপর যমযম পান করুন।",
    anchorName: "মাকামে ইবরাহিম",
  },
  "sai-start": {
    title: "সাঈ শুরু হচ্ছে সাফা থেকে",
    description:
      "সাফা থেকে শুরু করে সাত পাক পরিপূর্ণ করুন; প্রতি ল্যাপ শেষে লক্ষ্য রাখুন আপনি কোনও সময় পিছিয়ে পড়ছেন কি না।",
    anchorName: "আস-সাফা",
  },
  "sai-end": {
    title: "সাঈ শেষ হচ্ছে মারওয়ায়",
    description: "৭ম পাক শেষে মারওয়া পর্যন্ত যান এবং নিশ্চিত করুন শেষ পা মারওয়ায় পৌঁছায়।",
    anchorName: "আল-মারওয়া",
  },
};

/**
 * proximityRangeM — কত মিটারের মধ্যে থাকলে আনুষ্ঠানিক ল্যান্ডমার্ক ইঙ্গিত দেখানো হবে।
 * এর বাইরে হলে ইঙ্গিত স্বয়ংক্রিয়ভাবে লুকানো হয় (auto-hide), যাতে পুরো তওয়াফ/সাঈ জুড়ে
 * ইঙ্গিত ম্যাপের ওপর জ্বলজ্বল করে না থাকে।
 */
const PROXIMITY_RANGE_M = 25;

export function getContextualLandmarkHint(
  stage: string | undefined,
  anchorId: string | null,
  distanceMeters: number | null
): LandmarkHintData | null {
  if (!stage) return null;

  // কোনো লোকেশন নেই (GPS বন্ধ/দুর্বল) — সাধারণ গাইডেন্স ইঙ্গিত দেখাও, যাতে প্রিভিউ মোডে
  // হাজি দেখতে পান। কিন্তু লোকেশন আছে আর কোনো অ্যাংকর কাছে নেই — auto-hide (null)।
  const hasLocation = distanceMeters !== null;
  const within = (d: number | null, range = PROXIMITY_RANGE_M) => d !== null && d < range;

  if (stage === "tawaf") {
    if (anchorId === "black-stone" && within(distanceMeters)) {
      return LANDMARK_HINTS["tawaf"];
    }
    if (anchorId === "rukn-yamani" && within(distanceMeters)) {
      return LANDMARK_HINTS["tawaf-corner"];
    }
    return hasLocation ? null : LANDMARK_HINTS["tawaf"];
  }

  if (stage === "pray") {
    // প্রে-তওয়াফ নামাজ ধাপে সাধারণ ইঙ্গিত দেখাও ( proximity optional)।
    return LANDMARK_HINTS["pray-after-tawaf"];
  }

  if (stage === "sai") {
    if (anchorId === "safa" && within(distanceMeters)) {
      return LANDMARK_HINTS["sai-start"];
    }
    if (anchorId === "marwa" && within(distanceMeters)) {
      return LANDMARK_HINTS["sai-end"];
    }
    return hasLocation ? null : LANDMARK_HINTS["sai-start"];
  }

  return null;
}

export function getClosestAnchorId(anchors: string[], latitude: number, longitude: number) {
  let closest: { id: string; distance: number } | null = null;
  for (const id of anchors) {
    const anchor = getAnchorById(id);
    if (!anchor) continue;
    const [lng, lat] = anchor.location.coordinates;
    const distance = haversineDistance(latitude, longitude, lat, lng);
    if (closest === null || distance < closest.distance) {
      closest = { id, distance };
    }
  }
  return closest ? { id: closest.id, distance: closest.distance } : null;
}
