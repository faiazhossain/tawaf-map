import { create } from "zustand";

/**
 * মোবাইল গাইড শীটের এফেমারাল (অ-পারসিস্টেড) স্ন্যাপ অবস্থা - MapView ক্যামেরা প্যাডিং
 * ও ওভারলে অবস্থান এটি পড়ে।
 *
 * snapIndex-এর অর্থ "যেখানে শীট সেটল করছে" (settling-to): ধাপ পরিবর্তনের কোরিওগ্রাফি
 * টার্গেট ট্যাপের মুহূর্তেই এখানে লেখে, যাতে একই সময়ে চলা ১২০০ms-এর flyTo সঠিক শেষ-
 * প্যাডিং হিসাব করতে পারে। মানটি ভিজ্যুয়াল সেটলের চেয়ে সর্বোচ্চ ~৪০০ms এগিয়ে থাকতে
 * পারে। BottomSheet-এর onSnapChange ড্র্যাগ/টগলে একই স্টোর সিঙ্ক রাখে।
 *
 * সচেতন সিদ্ধান্ত: umrahGuideStore (পারসিস্টেড) বা mapStore (ক্যামেরা-মালিকানা)-এ
 * নয় - এফেমারাল শীট জ্যামিতির নিজস্ব ঘর।
 */
interface GuideSheetState {
  /** শীট যেখানে আছে বা সেটল করছে - GUIDE_SHEET_SNAP_POINTS-এর ইনডেক্স; শীট বন্ধ হলে null। */
  snapIndex: number | null;
  setSheetSnap: (index: number) => void;
  clearSheetSnap: () => void;
}

export const useGuideSheetStore = create<GuideSheetState>((set) => ({
  snapIndex: null,
  setSheetSnap: (index) => set({ snapIndex: index }),
  clearSheetSnap: () => set({ snapIndex: null }),
}));
