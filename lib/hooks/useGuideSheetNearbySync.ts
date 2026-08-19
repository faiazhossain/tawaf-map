"use client";

import { useEffect, useRef } from "react";
import { useBottomSheet } from "@/components/ui/bottom-sheet";
import { useNearbyStore } from "@/lib/store/nearbyStore";
import { useGuideSheetStore } from "@/lib/store/guideSheetStore";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { GUIDE_SHEET_DEFAULT_SNAP, GUIDE_NEARBY_SNAP } from "@/lib/utils/guide-sheet";

/**
 * "আমার কাছে" কোরিওগ্রাফি - নিচের প্রান্ত একই সময়ে এক প্রসঙ্গের দখলে:
 * চিপ চালু হলে গাইড শিট peek-এ নামে (ধাপ-বদলের ম্যাপ-মোমেন্টের মিরর), আর শিট
 * নিজে ওঠানো হলে (ড্র্যাগ, পেক-এক্সপ্যান্ড, ধাপ-বদল, গাইড খোলা) সক্রিয় বিভাগ
 * নিভে যায় - গাইড জেতে। ফলে চিপ-বার/কার্ড-স্ট্রিপ কখনো পর্দার মাঝে ভাসে না।
 *
 * শুধু আমাদের নামানো peek-ই চিপ বন্ধে আগের স্ন্যাপে ফেরে; ব্যবহারকারী নিজে
 * peek-এ নামিয়ে থাকলে তার বিন্যাস অপরিবর্তিত থাকে।
 *
 * ডেস্কটপে (>=md) গাইড পার্শ্ব-প্যানেল - নিচের প্রান্ত মুক্ত, তাই সব কাজ
 * mdUp গেটের ভেতরে (MapView-এর guideSheetActive ধারা)।
 *
 * বটম শিটের ভেতরের বডিতে কল করতে হয় (useBottomSheet-এর জন্য)।
 */
export function useGuideSheetNearbySync(): void {
  const { snapIndex, snapToIndex } = useBottomSheet();
  // রেফে রাখা যাতে সাবস্ক্রিপশন ইফেক্ট একবারই বাঁধে ও snapToIndex-এর আইডেন্টিটি
  // বদলালেও পুরনো ক্লোজার না ধরে (useGuideSheetStepSync ধাঁচ)।
  const snapIndexRef = useRef(snapIndex);
  snapIndexRef.current = snapIndex;
  const snapToIndexRef = useRef(snapToIndex);
  snapToIndexRef.current = snapToIndex;
  const setSheetSnap = useGuideSheetStore((s) => s.setSheetSnap);
  const mdUp = useMediaQuery("(min-width: 768px)");
  const mdUpRef = useRef(mdUp);
  mdUpRef.current = mdUp;
  // আমরাই কি শিট peek-এ নামিয়েছি - তবেই চিপ বন্ধে ফেরত তোলা।
  const peekedByNearbyRef = useRef(false);

  // চিপ চালু/বন্ধ ট্রানজিশন। ভ্যানিলা সাবস্ক্রিপশন ইচ্ছাকৃত: set()-এর ভেতরেই
  // সিঙ্ক্রোনাস চলে, তাই ক্যামেরার padding (স্টোরের টার্গেট স্ন্যাপ) ও ওভারলে
  // ভিজ্যুয়াল সেটল শেষ হওয়ার আগেই নতুন মান পড়ে।
  useEffect(() => {
    const unsubscribe = useNearbyStore.subscribe((state, prev) => {
      if (mdUpRef.current) return;
      if (state.activeCategory === prev.activeCategory) return;
      if (state.activeCategory !== null) {
        // চিপ চালু - শিট ওঠানো থাকলে peek-এ নামে, নিচের প্রান্ত ছেড়ে দেয়।
        if (snapIndexRef.current > 0) {
          peekedByNearbyRef.current = true;
          setSheetSnap(GUIDE_NEARBY_SNAP);
          snapToIndexRef.current(GUIDE_NEARBY_SNAP);
        }
      } else if (peekedByNearbyRef.current) {
        // চিপ বন্ধ - আমাদের নামানো শিট আগের স্ন্যাপে ফেরে।
        peekedByNearbyRef.current = false;
        setSheetSnap(GUIDE_SHEET_DEFAULT_SNAP);
        snapToIndexRef.current(GUIDE_SHEET_DEFAULT_SNAP);
      }
    });
    return unsubscribe;
  }, [setSheetSnap]);

  // শিট খোলা মুহূর্তে বিভাগ সক্রিয় থাকলে গাইডই দখল নেয় - চিপ নিভে যায়।
  // (বডিও তখনই মাউন্ট, শীট বন্ধ থাকলে চিলড্রেন আনমাউন্ট।)
  useEffect(() => {
    if (mdUpRef.current) return;
    if (useNearbyStore.getState().activeCategory !== null) {
      peekedByNearbyRef.current = false;
      useNearbyStore.getState().setActiveCategory(null);
    }
  }, []);

  // সেটল-হওয়া snapIndex peek-এর ঊর্ধ্বে গেলে ব্যবহারকারীই শিট তুলেছে (আমাদের
  // peek/restore সেটেলেও এটি চলে, তখন মালিকানা আগেই ছাড়া) - গাইড জেতে।
  useEffect(() => {
    if (mdUpRef.current) return;
    if (snapIndex > 0) {
      peekedByNearbyRef.current = false;
      if (useNearbyStore.getState().activeCategory !== null) {
        useNearbyStore.getState().setActiveCategory(null);
      }
    }
  }, [snapIndex]);
}
