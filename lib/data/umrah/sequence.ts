import { UMRAH_STEPS } from "./steps";
import { MIQAT_POINTS, resolveMiqatForTravelPath } from "./miqat";
import type { UmrahProfile, UmrahStep, MiqatPoint } from "@/types/umrah";

/**
 * ধাপ-সমাধান (sequence resolution) - গাইডের সবচেয়ে ঝুঁকিপূর্ণ সরল লজিক।
 *
 * প্রোফাইল অনুযায়ী ব্যক্তিগতকৃত ধাপের অনুক্রম তৈরি করে:
 *   1. সমস্ত ধাপ order অনুসারে সাজানো
 *   2. লিঙ্গ অনুযায়ী ফিল্টার (male-only/female-only বাদ)
 *   3. যাত্রাপথ অনুযায়ী প্রাসঙ্গিকতা যাচাই
 *   4. মিকাত অ্যাংকর সমাধান
 *
 * এই মডিউলটি সম্পূর্ণ বিশুদ্ধ (pure) - কোনো পার্শ্বপ্রভাব নেই, সহজে পরীক্ষাযোগ্য।
 */

/** একটি ধাপ প্রদত্ত প্রোফাইলের জন্য দৃশ্যমান কিনা (লিঙ্গ ও প্রাসঙ্গিকতা যাচাই) */
export function isStepVisible(step: UmrahStep, profile: UmrahProfile): boolean {
  // লিঙ্গ ফিল্টার
  if (step.gender !== "all" && step.gender !== profile.gender) {
    return false;
  }

  // যাত্রাপথ-নির্দিষ্ট ধাপের প্রাসঙ্গিকতা (ভবিষ্যতে সম্প্রসারণযোগ্য)
  // বর্তমানে সমস্ত ধাপ সব যাত্রাপথে প্রাসঙ্গিক; বিষয়বস্তু প্রোফাইল অনুযায়ী ঢালাই হয়।
  return true;
}

/**
 * প্রোফাইল অনুযায়ী ব্যক্তিগতকৃত ধাপের অনুক্রম তৈরি করে।
 * order অনুসারে সাজানো ও লিঙ্গ/প্রাসঙ্গিকতা অনুযায়ী ফিল্টারকৃত।
 */
export function resolveSteps(profile: UmrahProfile): UmrahStep[] {
  return UMRAH_STEPS.filter((step) => isStepVisible(step, profile)).sort(
    (a, b) => a.order - b.order
  );
}

/**
 * প্রোফাইলের যাত্রাপথ থেকে প্রযোজ্য মিকাত পয়েন্ট সমাধান করে।
 * যাত্রাপথে নির্দিষ্ট মিকাত না থাকলে (জেদ্দা/অন্যান্য) null ফেরত দেয়।
 */
export function resolveMiqatAnchor(profile: UmrahProfile): MiqatPoint | null {
  const mapping = resolveMiqatForTravelPath(profile.travelPath);
  if (!mapping.miqatId) return null;
  return MIQAT_POINTS.find((m) => m.id === mapping.miqatId) ?? null;
}

/**
 * একটি কাউন্টার ধাপ তার সর্বোচ্চ মানে পৌঁছেছে কিনা (স্বয়ংক্রিয় অগ্রগতির জন্য)।
 * যেমন তওয়াফ ৭/৭ হলে ধাপটি সম্পন্ন।
 */
export function isCounterComplete(step: UmrahStep, counterValue: number): boolean {
  if (!step.counter) return false;
  return counterValue >= step.counter.max;
}

/** একটি ধাপ সম্পন্ন হিসেবে গণ্য হবে কিনা (ম্যানুয়াল/কাউন্টার অনুযায়ী) */
export function isStepComplete(
  step: UmrahStep,
  counterValue: number,
  manuallyMarked: boolean
): boolean {
  if (step.isCompleteWhen === "counter-max") {
    return isCounterComplete(step, counterValue);
  }
  // manual, proximity, বা manual|proximity - ম্যানুয়াল চিহ্ন বা কাউন্টার সম্পন্নতা
  return manuallyMarked || isCounterComplete(step, counterValue);
}

/** অনুক্রমে পরবর্তী সম্পন্ন-না-হওয়া ধাপের ইনডেক্স খুঁজে দেয় (-1 যদি সব সম্পন্ন) */
export function findNextIncompleteIndex(
  steps: UmrahStep[],
  counters: Record<string, number>,
  completed: Record<string, boolean>
): number {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const counterValue = counters[step.id] ?? step.counter?.min ?? 0;
    if (!isStepComplete(step, counterValue, !!completed[step.id])) {
      return i;
    }
  }
  return -1;
}

/** সম্পন্ন হওয়া ধাপের সংখ্যা (অগ্রগতি বারের জন্য) */
export function countCompleted(
  steps: UmrahStep[],
  counters: Record<string, number>,
  completed: Record<string, boolean>
): number {
  return steps.filter((step) => {
    const counterValue = counters[step.id] ?? step.counter?.min ?? 0;
    return isStepComplete(step, counterValue, !!completed[step.id]);
  }).length;
}
