import { HARAM_GATES } from "@/lib/data/gates";
import type { Gate } from "@/types/gate";
import { haversineDistance } from "@/lib/utils/distance";

/**
 * গেট সুপারিশ - "কোন গেট?" ইঞ্জিন
 *
 * বর্তমান ধাপের জন্য উপযুক্ত গেট নির্বাচন করে (Section 7.6 suitableFor অনুযায়ী)।
 * ব্যবহারকারীর অবস্থান থাকলে দূরত্ব অনুসারে সাজায়। উপযুক্ত গেট না থাকলে
 * ধাপের প্রকৃতি অনুযায়ী ফলব্যাক (ওমরাহ-টাইপ বা সকল গেট) দেয়।
 */

/** ব্যবহারকারীর অবস্থান [lng, lat] থেকে গেটের দূরত্ব অনুযায়ী তুলনাকারী */
function byDistance(userLocation: [number, number]) {
  return (a: Gate, b: Gate) => {
    const da = haversineDistance(
      userLocation[1],
      userLocation[0],
      a.location.coordinates[1],
      a.location.coordinates[0]
    );
    const db = haversineDistance(
      userLocation[1],
      userLocation[0],
      b.location.coordinates[1],
      b.location.coordinates[0]
    );
    return da - db;
  };
}

/**
 * একটি ধাপের জন্য সুপারিশকৃত গেটের তালিকা।
 * @param stepId বর্তমান ধাপের id
 * @param userLocation ব্যবহারকারীর [lng, lat] বা null
 * @param limit সর্বোচ্চ কয়টি গেট
 */
export function recommendGatesForStep(
  stepId: string,
  userLocation?: [number, number] | null,
  limit = 3
): Gate[] {
  // ১) এই ধাপের জন্য স্পষ্টভাবে উপযুক্ত চিহ্নিত গেট
  let candidates = HARAM_GATES.filter((g) => g.suitableFor?.some((s) => s.stepId === stepId));

  // ২) ফলব্যাক: হারামে প্রবেশ/তওয়াফ ধাপে ওমরাহ-টাইপ গেট
  if (candidates.length === 0 && (stepId === "enter-haram" || stepId === "tawaf")) {
    candidates = HARAM_GATES.filter((g) => g.type === "umrah");
  }

  // ৩) শেষ ফলব্যাক: সব গেট
  if (candidates.length === 0) {
    candidates = HARAM_GATES;
  }

  const sorted = userLocation ? [...candidates].sort(byDistance(userLocation)) : candidates;
  return sorted.slice(0, limit);
}

/** একটি ধাপের জন্য শীর্ষ সুপারিশকৃত গেট (বা null) */
export function recommendGateForStep(
  stepId: string,
  userLocation?: [number, number] | null
): Gate | null {
  return recommendGatesForStep(stepId, userLocation, 1)[0] ?? null;
}

/** ব্যবহারকারী অবস্থান থেকে একটি গেটের দূরত্ব (মিটার) */
export function distanceToGate(userLocation: [number, number], gate: Gate): number {
  return haversineDistance(
    userLocation[1],
    userLocation[0],
    gate.location.coordinates[1],
    gate.location.coordinates[0]
  );
}
