"use client";

import { useCallback, useState } from "react";
import {
  useUmrahGuideStore,
  selectCurrentStep,
  selectIsComplete,
} from "@/lib/store/umrahGuideStore";
import type { UmrahStep } from "@/types/umrah";

/**
 * "পরবর্তী ধাপ" বোতামের নিরাপদ হ্যান্ডলার - completion gate-এর উপর ভিত্তি করে।
 *
 * বর্তমান ধাপ সম্পন্ন হলে সাধারণভাবে সামনে এগোয়। অসম্পন্ন হলে সেই ধাপটিকে
 * `blocker` হিসেবে ধরে রাখে, যাতে কলার (UmrahStepList) IncompleteStepDialog দেখাতে
 * পারে - যেখানে ব্যবহারকারী নিশ্চিত হয়ে ধাপ সম্পন্ন করতে পারেন।
 *
 * স্টোরের nextStep-এর নিজস্ব gate এই হুকের সঙ্গে সামঞ্জস্যপূর্ণ (একই isStepComplete
 * লজিক ব্যবহার করে), তাই দুটি একমত হয় - UI শুধু একটি বান্ধব মডাল যোগ করে।
 */
export function useGuardedNextStep() {
  const [blocker, setBlocker] = useState<UmrahStep | null>(null);

  const handleNext = useCallback(() => {
    const state = useUmrahGuideStore.getState();
    const current = selectCurrentStep(state);
    if (!current) return;
    if (selectIsComplete(state, current.id)) {
      state.nextStep();
    } else {
      setBlocker(current);
    }
  }, []);

  const closeDialog = useCallback(() => setBlocker(null), []);

  const confirmMarkComplete = useCallback(() => {
    if (!blocker) return;
    // counter-max ধাপ (তওয়াফ/সাঈ) ম্যানুয়ালি সম্পন্ন করা যায় না - শুধু কাউন্টার
    // দিয়ে। ডায়ালগ এসব ধাপে বোতাম দেখায় না, তবে রক্ষাবস্থায় এখানেও বাধা দেওয়া হলো।
    if (blocker.isCompleteWhen === "counter-max") {
      setBlocker(null);
      return;
    }
    const { markComplete, nextStep } = useUmrahGuideStore.getState();
    markComplete(blocker.id);
    setBlocker(null);
    // markComplete gate-কে সন্তুষ্ট করে, তাই স্বাভাবিক nextStep দিয়ে এগোনো নিরাপদ।
    nextStep();
  }, [blocker]);

  return { blocker, handleNext, closeDialog, confirmMarkComplete } as const;
}
