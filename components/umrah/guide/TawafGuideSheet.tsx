"use client";

import { useCallback, useEffect, useMemo } from "react";
import { ChevronRight, ChevronLeft, ChevronsUp, ChevronsDown } from "lucide-react";
import { BottomSheet, useBottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { useUmrahGuideStore, selectCurrentStep, selectCounter } from "@/lib/store/umrahGuideStore";
import { useGuideSheetStore } from "@/lib/store/guideSheetStore";
import { getStepById } from "@/lib/data/umrah/steps";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import { GUIDE_SHEET_SNAP_POINTS, GUIDE_SHEET_DEFAULT_SNAP } from "@/lib/utils/guide-sheet";
import { useGuideSheetStepSync } from "@/lib/hooks/useGuideSheetStepSync";
import { InstructionCard } from "./InstructionCard";
import { CircuitControl } from "./CircuitControl";
import { GuidePeek } from "./GuidePeek";
import { GuideControls } from "./GuideControls";
import { StepPagination } from "./StepPagination";
import { StepDetail } from "./StepDetail";
import { LostGroupHelper } from "@/components/umrah/LostGroupHelper";
import { stageLabel } from "./stage-label";

interface TawafGuideSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenMiqatOverview?: () => void;
  onOpenMistake: () => void;
  /** পরবর্তী ধাপ হ্যান্ডলার (সাধারণত useGuardedNextStep থেকে)। না দিলে স্টোরের nextStep। */
  onNext?: () => void;
}

/**
 * মোবাইল গাইডেড শীট - তিন স্ন্যাপ অবস্থা: peek (এক লাইন), normal (পেজিনেশন + হিরো
 * নির্দেশ + কাউন্টার + পরবর্তী), expanded (পেজিনেশন + শুধু বর্তমান ধাপের সম্পূর্ণ বিস্তারিত)।
 * ব্যাকড্রপ ছাড়া, যাতে মানচিত্র সবসময় দৃশ্যমান থাকে। বাংলা-প্রথম, টিল থিম।
 * ড্র্যাগ-করে ছোট করা যায় (peek পর্যন্ত), কিন্তু ড্র্যাগে কখনো বন্ধ হয় না -
 * গাইড চালু/বন্ধ করার একমাত্র পথ নেভবারের ওমরাহ টগল (নিচে টেনে ভুলে গাইড
 * নিষ্ক্রিয় হয়ে যাওয়ায় ব্যবহারকারী হারিয়ে যেত কোথায় শীট গেল)।
 */
export function TawafGuideSheet({
  open,
  onOpenChange,
  onOpenMiqatOverview,
  onOpenMistake,
  onNext,
}: TawafGuideSheetProps) {
  // শীটের সেটল-টার্গেট স্টোরে প্রকাশ - MapView-এর ক্যামেরা প্যাডিং ও ওভারলে এটি পড়ে।
  const setSheetSnap = useGuideSheetStore((s) => s.setSheetSnap);
  const clearSheetSnap = useGuideSheetStore((s) => s.clearSheetSnap);
  const handleSnapChange = useCallback(
    (snapIndex: number) => setSheetSnap(snapIndex),
    [setSheetSnap]
  );

  useEffect(() => {
    if (open) {
      setSheetSnap(GUIDE_SHEET_DEFAULT_SNAP);
    } else {
      clearSheetSnap();
    }
    return clearSheetSnap;
  }, [open, setSheetSnap, clearSheetSnap]);

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[...GUIDE_SHEET_SNAP_POINTS]}
      defaultSnap={GUIDE_SHEET_DEFAULT_SNAP}
      onSnapChange={handleSnapChange}
      showBackdrop={false}
      dismissOnDragDown={false}
    >
      <SheetBody
        onOpenMiqatOverview={onOpenMiqatOverview}
        onOpenMistake={onOpenMistake}
        onNext={onNext}
      />
    </BottomSheet>
  );
}

function SheetBody({
  onOpenMiqatOverview,
  onOpenMistake,
  onNext,
}: {
  onOpenMiqatOverview?: () => void;
  onOpenMistake: () => void;
  onNext?: () => void;
}) {
  const { snapIndex, snapToIndex } = useBottomSheet();
  // ধাপ বদলালেই শীট normal স্ন্যাপে ফেরে (কোরিওগ্রাফি) - হুক শর্তহীন, তাই শীরোষে।
  useGuideSheetStepSync();
  const step = useUmrahGuideStore(selectCurrentStep);
  const counterValue = useUmrahGuideStore((s) => (step ? selectCounter(s, step.id) : 0));
  const stepIds = useUmrahGuideStore((s) => s.stepIds);
  const currentIndex = useUmrahGuideStore((s) => s.currentIndex);
  const storeNextStep = useUmrahGuideStore((s) => s.nextStep);
  const prevStep = useUmrahGuideStore((s) => s.prevStep);
  const nextStepAction = onNext ?? storeNextStep;
  const steps = useMemo(
    () => stepIds.map((id) => getStepById(id)).filter((s): s is NonNullable<typeof s> => !!s),
    [stepIds]
  );
  if (!step) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        একটি ধাপ নির্বাচন করুন
      </div>
    );
  }

  const isLast = currentIndex >= steps.length - 1;
  const counter = step.counter;

  // Peek: এক লাইন, সবচেয়ে কম জায়গা
  if (snapIndex === 0) {
    return <GuidePeek step={step} counterValue={counterValue} onExpand={() => snapToIndex(1)} />;
  }

  const isExpanded = snapIndex >= 2;

  return (
    <div className="space-y-4 px-4 pb-4">
      <GuideControls
        steps={steps}
        onOpenMiqatOverview={onOpenMiqatOverview}
        onOpenMistake={onOpenMistake}
      />

      <StepPagination steps={steps} />

      <InstructionCard step={step} counterValue={counterValue} />

      {/* কম্প্যাক্ট (স্ন্যাপ ১) ভিউতে কাউন্টার উপরে থাকে। প্রসারিত ভিউতে কাউন্টার ধাপের
          ভেতরে (StepDetail) চলে যায়, তাই এই অনুলিপি লুকানো হয়। */}
      {counter && !isExpanded && <CircuitControl step={step} />}

      {isExpanded ? (
        <>
          <StepDetail step={step} counterValue={counterValue} />
          <div className="pt-1 border-t border-border/40">
            <LostGroupHelper />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={prevStep}
              disabled={currentIndex === 0}
              className="border-border bg-muted/60 text-foreground hover:bg-muted"
            >
              <ChevronLeft className="w-4 h-4" /> পেছনে
            </Button>
            {/* বিস্তারিত পড়ে সরাসরি এগোনো যায় - ট্যাপ করলেই কোরিওগ্রাফি শীট normal
                স্ন্যাপে নামিয়ে ক্যামেরা flyTo দৃশ্যমান করে। শেষ ধাপে এগোনোর কিছু নেই,
                তখন সংক্ষেপে ফেরার রাস্তা রাখা হয়। */}
            {isLast ? (
              <Button
                size="sm"
                onClick={() => snapToIndex(1)}
                variant="outline"
                className="ml-auto border-border bg-muted/60 text-foreground hover:bg-muted gap-1"
              >
                <ChevronsUp className="w-4 h-4" /> সংক্ষেপে
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={nextStepAction}
                className="ml-auto bg-primary hover:bg-primary-hover text-primary-foreground border-0 gap-1"
              >
                পরবর্তী ধাপ <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <Button
            onClick={() => snapToIndex(2)}
            variant="outline"
            className="w-full justify-center gap-1 border-border bg-muted/60 text-foreground hover:bg-muted"
          >
            <ChevronsDown className="w-4 h-4" /> বিস্তারিত
          </Button>
          <Button
            onClick={nextStepAction}
            disabled={isLast}
            className="w-full justify-center gap-1 bg-primary hover:bg-primary-hover text-primary-foreground border-0"
          >
            পরবর্তী ধাপ <ChevronRight className="w-4 h-4" />
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            {stageLabel(step.stage)}
            {counter ? ` · ${toBengaliNumber(counterValue)}/${toBengaliNumber(counter.max)}` : ""}
          </p>
        </>
      )}
    </div>
  );
}
