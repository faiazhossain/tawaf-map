import type { PaddingOptions } from "maplibre-gl";
import {
  guideSheetHeightPx,
  GUIDE_CAMERA_TOP_PADDING_PX,
  GUIDE_CAMERA_SIDE_PADDING_PX,
} from "@/lib/utils/guide-sheet";

/**
 * "আমার কাছে" ডিটেইল শিট (~৩০% ভিউপোর্ট) ও মানচিত্রের অবস্থান গণিত।
 *
 * গাইড শিট (lib/utils/guide-sheet.ts) ধারা অনুসরণ করে — ক্যামেরা প্যাডিং
 * দুই শিটের মধ্যে যেটি লম্বা তার হিসাব নেয়, তাই গাইড-ক্যামেরা মুভ ও
 * নিকটবর্তী-ক্যামেরা মুভ কখনো টার্গেটকে খোলা শিটের নিচে চাপা করে না।
 */

/** ডিটেইল শিটের ডিফল্ট স্ন্যাপ — ভিউপোর্টের ভগ্নাংশ (~৩০%) */
export const NEARBY_DETAIL_SHEET_FRACTION = 0.3;
/** শিটের ওপরের ধার থেকে ক্যামেরা-প্যাডিংয়ের ফাঁক (গাইডের মান) */
export const NEARBY_CAMERA_BOTTOM_GAP_PX = 16;

/** চিপ-বারের প্রায় উচ্চতা (px) — কার্ড-স্ট্রিপ স্ট্যাকিংয়ের হিসাবে */
export const NEARBY_CHIP_BAR_HEIGHT_PX = 56;
/** চিপ-বার ও কার্ড-স্ট্রিপের মধ্যের ফাঁক */
export const NEARBY_CARDS_STRIP_GAP_PX = 8;

/** ডিটেইল শিটের উচ্চতা px-এ */
export function nearbyDetailSheetHeightPx(viewportHeightPx: number): number {
  return Math.round(NEARBY_DETAIL_SHEET_FRACTION * Math.max(viewportHeightPx, 0));
}

/**
 * কম্পোজড flyTo/fitBounds padding — গাইড শিট ও নিকটবর্তী ডিটেইল শিটের মধ্যে
 * যেটি লম্বা তার উচ্চতা নেয়। দুটোই বন্ধ হলে undefined (প্যাডিং নেই)।
 * ডিটেইল বন্ধ থাকলে ফলাফল guideCameraPadding-এর সমান।
 */
export function nearbyCameraPadding(
  guideSnapIndex: number | null,
  nearbyDetailOpen: boolean,
  viewportHeightPx: number
): PaddingOptions | undefined {
  const guideHeight = guideSheetHeightPx(guideSnapIndex, viewportHeightPx);
  const detailHeight = nearbyDetailOpen ? nearbyDetailSheetHeightPx(viewportHeightPx) : 0;
  const bottom = Math.max(guideHeight, detailHeight);
  if (bottom <= 0) return undefined;
  return {
    top: GUIDE_CAMERA_TOP_PADDING_PX,
    bottom: bottom + NEARBY_CAMERA_BOTTOM_GAP_PX,
    left: GUIDE_CAMERA_SIDE_PADDING_PX,
    right: GUIDE_CAMERA_SIDE_PADDING_PX,
  };
}
