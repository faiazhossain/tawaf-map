import type { FlyToOptions, PaddingOptions } from "maplibre-gl";

/**
 * গাইড শীট ও মানচিত্রের অবস্থান গণিত - একই সূত্র শীট, ক্যামেরা ও ওভারলে সবাই ব্যবহার করে,
 * যাতে "অ্যাংকর দৃশ্যমান অংশে থাকে" ও "ওভারলে শীটের ওপরে থাকে" কখনো আলাদা হয়ে না যায়।
 *
 * snapIndex-এর অর্থ guideSheetStore অনুযায়ী "যেখানে শীট সেটল করছে" (settling-to) -
 * টার্গেট ট্যাপের মুহূর্তেই লেখা হয়, তাই ভিজ্যুয়াল সেটল শেষ হওয়ার আগেই সঠিক মান পাওয়া যায়।
 * null মানে শীট বন্ধ।
 */

/** গাইড শীটের স্ন্যাপ ফ্র্যাকশন (peek / normal / expanded)। */
export const GUIDE_SHEET_SNAP_POINTS = [0.12, 0.42, 0.92] as const;
/** খোলা মাত্র যে স্ন্যাপে থাকে। */
export const GUIDE_SHEET_DEFAULT_SNAP = 1;
/** ধাপ পরিবর্তনের কোরিওগ্রাফি সবসময় এই স্ন্যাপে ফেরে - হিরো নির্দেশ ও মানচিত্র উভয় দৃশ্যমান। */
export const GUIDE_STEP_SNAP = 1;
/** "আমার কাছে" চিপ চালুর ম্যাপ-মোমেন্ট স্ন্যাপ — গাইড peek-এ নেমে নিচের প্রান্ত ছেড়ে দেয়। */
export const GUIDE_NEARBY_SNAP = 0;
/** ওভারলে ও শীটের ওপরের ধারের মাঝের ফাঁক। */
export const GUIDE_OVERLAY_GAP_PX = 12;
/** ক্যামেরা প্যাডিং-এর ওপরের মার্জিন - RitualRoundHud (top-4 কেন্দ্রে) সরিয়ে রাখে। */
export const GUIDE_CAMERA_TOP_PADDING_PX = 96;
/** ক্যামেরা প্যাডিং-এর পাশের মার্জিন। */
export const GUIDE_CAMERA_SIDE_PADDING_PX = 24;
/** ক্যামেরা প্যাডিং ও শীটের ওপরের ধারের মাঝের ফাঁক - অ্যাংকর যেন গোল ধারে চাপা না পড়ে। */
export const GUIDE_CAMERA_BOTTOM_GAP_PX = 16;

/**
 * শীটের বর্তমান/লক্ষ্য উচ্চতা px-এ। snapIndex null (শীট বন্ধ) বা অজানা হলে 0।
 */
export function guideSheetHeightPx(snapIndex: number | null, viewportHeightPx: number): number {
  if (snapIndex === null) return 0;
  const fraction = GUIDE_SHEET_SNAP_POINTS[snapIndex];
  if (fraction === undefined) return 0;
  return Math.round(fraction * Math.max(viewportHeightPx, 0));
}

/**
 * ওভারলের (LandmarkHint/RecenterButton) bottom অফসেট। শীট নিষ্ক্রিয় হলে undefined -
 * তখন ক্লাস-ভিত্তিক ডিফল্ট অবস্থানই বহাল থাকে।
 */
export function guideOverlayBottomPx(
  snapIndex: number | null,
  viewportHeightPx: number
): number | undefined {
  const height = guideSheetHeightPx(snapIndex, viewportHeightPx);
  return height > 0 ? height + GUIDE_OVERLAY_GAP_PX : undefined;
}

/**
 * শিট peek-এর ঊর্ধ্বে উঠে আছে কি না (শীট বন্ধ হলে false)। উঠলে নিচের প্রান্ত
 * গাইডের দখলে - "আমার কাছে" চিপ-বার/কার্ড-স্ট্রিপ তখন লুকিয়ে থাকে; peek বা
 * বন্ধ শিটেই কেবল দেখা যায় (নিচের প্রান্তে একই সময়ে একজনই মালিক)।
 */
export function guideSheetRaised(snapIndex: number | null): boolean {
  return snapIndex !== null && snapIndex > 0;
}

/**
 * flyTo-র শেষ-অবস্থার padding - অ্যাংকর শীটের ওপরের দৃশ্যমান অংশে বসে। শীট নিষ্ক্রিয়
 * হলে undefined।
 *
 * দ্রষ্টব্য: prefers-reduced-motion-এ maplibre flyTo-কে jumpTo-তে রূপান্তর করে ও
 * padding বাদ দিয়ে দেয় - তখন অ্যাংকর শীটের নিচে পড়তে পারে; সীমিত ও গ্রহণযোগ্য।
 */
export function guideCameraPadding(
  snapIndex: number | null,
  viewportHeightPx: number
): PaddingOptions | undefined {
  const height = guideSheetHeightPx(snapIndex, viewportHeightPx);
  if (height <= 0) return undefined;
  return {
    top: GUIDE_CAMERA_TOP_PADDING_PX,
    bottom: height + GUIDE_CAMERA_BOTTOM_GAP_PX,
    left: GUIDE_CAMERA_SIDE_PADDING_PX,
    right: GUIDE_CAMERA_SIDE_PADDING_PX,
  };
}

/**
 * flyTo অপশনে padding যোগ করে (একমাত্র টাইপ-কাস্ট পয়েন্ট)। maplibre 4.7 রানটাইমে
 * flyTo-র padding সমর্থন করে, কিন্তু FlyToOptions টাইপে ঘোষিত নেই - তাই একবারই এখানে
 * কাস্ট করে MapView-কে টাইপ-নিরাপদ রাখা হয়। padding undefined হলে অপশন অপরিবর্তিত।
 */
export function withGuidePadding(
  options: FlyToOptions,
  padding: PaddingOptions | undefined
): FlyToOptions {
  if (!padding) return options;
  return { ...options, padding } as FlyToOptions;
}
