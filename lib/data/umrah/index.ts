/**
 * ওমরাহ গাইড - সামগ্রী ভাণ্ডার (barrel export)
 *
 * সমস্ত ওমরাহ বিষয়বস্তু স্থির (static) ডেটা হিসেবে বান্ডল করা হয়, যাতে অফলাইনেও
 * সম্পূর্ণ গাইড কাজ করে (পরিকল্পনা ধারা ৫.৭ ও ৯.৮)। কোনো API বা ব্যাকএন্ড প্রয়োজন নেই।
 */

// আনুষ্ঠানিক স্থান
export { UMRAH_ANCHORS, getAnchorById, getAnchorsByRole } from "./anchors";

// মিকাত পয়েন্ট ও ইঞ্জিন
export {
  MIQAT_POINTS,
  TRAVEL_PATH_MIQAT,
  getMiqatById,
  resolveMiqatForTravelPath,
  AIR_IHRAM_CHECKLIST,
  miqatRingBounds,
  type LatLngBounds,
} from "./miqat";

// দোয়া
export { UMRAH_DUAS, getDuaById, getDuasByIds } from "./duas";

// ধাপসমূহ
export { UMRAH_STEPS, getStepById } from "./steps";

// ভুল / পরিত্রাণ সহায়ক
export { UMRAH_MISTAKES, getMistakeById, getMistakesByCategory } from "./mistakes";

// ধাপ-সমাধান লজিক
export {
  resolveSteps,
  resolveMiqatAnchor,
  isCounterComplete,
  isStepComplete,
  isStepVisible,
  findNextIncompleteIndex,
  countCompleted,
} from "./sequence";

// গেট সুপারিশ
export { recommendGatesForStep, recommendGateForStep, distanceToGate } from "./gate-recommendation";

// টাইপ পুনঃরপ্রকাশ (সুবিধার্থে)
export type {
  RitualAnchor,
  AnchorRole,
  UmrahStep,
  UmrahStage,
  StepCounter,
  CompletionCondition,
  GenderFilter,
  UmrahProfile,
  TravelPath,
  TravelGroup,
  Madhhab,
  Accessibility,
  Dua,
  Mistake,
  MistakeBranch,
  MistakeCategory,
  MistakeOutcome,
  ExpiationType,
  Validity,
  MiqatPoint,
  TravelPathMiqat,
  GateSuitability,
  LocalizedString,
} from "@/types/umrah";
