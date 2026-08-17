"use client";

import { useEffect, useRef } from "react";
import { useBottomSheet } from "@/components/ui/bottom-sheet";
import { useUmrahGuideStore } from "@/lib/store/umrahGuideStore";
import { useGuideSheetStore } from "@/lib/store/guideSheetStore";
import { GUIDE_STEP_SNAP } from "@/lib/utils/guide-sheet";

/**
 * ধাপ-পরিবর্তনের কোরিওগ্রাফি - গাইডের যেকোনো পথে ধাপ বদলালে (বোতাম, পেজিনেশন,
 * মানচিত্র-মার্কার, ভুল-সহায়ক, রিহাইড্রেট) শীট normal স্ন্যাপে ফিরে যায়, যাতে
 * হিরো নির্দেশ পড়া ও ক্যামেরার flyTo/অ্যানিমেশন দেখা একই সময়ে সম্ভব হয়।
 *
 * ভ্যানিলা সাবস্ক্রিপশন ইচ্ছাকৃত: set()-এর ভেতরেই সিঙ্ক্রোনাস চলে, তাই MapView-এর
 * flyTo ইফেক্ট (ট্রি-ক্রমে আগে চলে) টার্গেট স্ন্যাপ স্টোরে লেখা হওয়ার পরেই পড়ে -
 * রিঅ্যাক্ট কমিট-অর্ডারের রেস নেই। শীট বন্ধ থাকলে চিলড্রেন আনমাউন্ট থাকে, সাবস্ক্রিপশনও খুলে যায়।
 *
 * বটম শীটের ভেতরের বডিতে কল করতে হয় (useBottomSheet-এর জন্য)।
 */
export function useGuideSheetStepSync(): void {
  const { snapToIndex } = useBottomSheet();
  // রেফে রাখা যাতে সাবস্ক্রিপশন এফেক্ট একবারই বাঁধে ও snapToIndex-এর আইডেন্টিটি
  // বদলালেও পুরনো ক্লোজার না ধরে।
  const snapToIndexRef = useRef(snapToIndex);
  snapToIndexRef.current = snapToIndex;
  const setSheetSnap = useGuideSheetStore((s) => s.setSheetSnap);

  useEffect(() => {
    const unsubscribe = useUmrahGuideStore.subscribe((state, prev) => {
      if (state.currentIndex === prev.currentIndex) return;
      // ক্যামেরার padding সঠিক হওয়ার জন্য টার্গেট স্ন্যাপ সঙ্গে সঙ্গে স্টোরে -
      // ভিজ্যুয়াল সেটল (সর্বোচ্চ ~৪০০ms) পরে আসবে।
      setSheetSnap(GUIDE_STEP_SNAP);
      snapToIndexRef.current(GUIDE_STEP_SNAP);
    });
    return unsubscribe;
  }, [setSheetSnap]);
}
