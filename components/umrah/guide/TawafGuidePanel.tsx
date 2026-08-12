"use client";

import { useEffect, useMemo, useRef } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUmrahGuideStore, selectCurrentStep, selectCounter } from "@/lib/store/umrahGuideStore";
import { getStepById } from "@/lib/data/umrah/steps";
import { InstructionCard } from "./InstructionCard";
import { GuideControls } from "./GuideControls";
import { StepPagination } from "./StepPagination";
import { StepDetail } from "./StepDetail";
import { LostGroupHelper } from "@/components/umrah/LostGroupHelper";

interface TawafGuidePanelProps {
  onOpenChange: (open: boolean) => void;
  onOpenMiqatOverview?: () => void;
  onOpenMistake: () => void;
  /** পরবর্তী ধাপ হ্যান্ডলার (সাধারণত useGuardedNextStep থেকে)। না দিলে স্টোরের nextStep। */
  onNext?: () => void;
}

/**
 * ডেস্কটপ গাইডেড প্যানেল - ডানদিকে সরু ভাসমান প্যানেল। উপরে পেজিনেশন ও হিরো নির্দেশ,
 * নিচে শুধু বর্তমান ধাপের সম্পূর্ণ বিস্তারিত (এক ধাপ এক সময়ে), স্ক্রলযোগ্য।
 */
export function TawafGuidePanel({
  onOpenChange,
  onOpenMiqatOverview,
  onOpenMistake,
  onNext,
}: TawafGuidePanelProps) {
  const step = useUmrahGuideStore(selectCurrentStep);
  const counterValue = useUmrahGuideStore((s) => (step ? selectCounter(s, step.id) : 0));
  const stepIds = useUmrahGuideStore((s) => s.stepIds);
  const currentIndex = useUmrahGuideStore((s) => s.currentIndex);
  const storeNextStep = useUmrahGuideStore((s) => s.nextStep);
  const prevStep = useUmrahGuideStore((s) => s.prevStep);
  const handleNext = onNext ?? storeNextStep;
  const steps = useMemo(
    () => stepIds.map((id) => getStepById(id)).filter((s): s is NonNullable<typeof s> => !!s),
    [stepIds]
  );
  const nextStepTitle = steps[currentIndex + 1]?.title.bn;
  const nextStepSummary = steps[currentIndex + 1]?.summary.bn;

  const isLast = currentIndex >= steps.length - 1;

  // ধাপ বদলালে স্ক্রলযোগ্য অংশের শীর্ষে ফিরে যাও — নতুন ধাপ পড়া শুরু সবার উপর থেকে।
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [currentIndex]);

  return (
    <div
      className="absolute top-4 right-4 z-[100] w-96 h-[calc(100dvh-7rem)]"
      data-testid="umrah-step-list-desktop"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div
        className="flex flex-col h-full overflow-hidden rounded-2xl border border-border/60 bg-surface/95 backdrop-blur-xl shadow-2xl"
        role="dialog"
        aria-modal="false"
        aria-label="ওমরাহ গাইড প্যানেল"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/20 to-primary/5">
          <h3 className="text-base font-bold text-foreground">ওমরাহ গাইড</h3>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground text-xs px-2 py-1 rounded-md hover:bg-muted transition-colors"
          >
            বন্ধ
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-track-surface scrollbar-thumb-border"
        >
          <GuideControls
            steps={steps}
            onOpenMiqatOverview={onOpenMiqatOverview}
            onOpenMistake={onOpenMistake}
          />

          {step ? (
            <>
              <StepPagination steps={steps} />

              <InstructionCard
                step={step}
                counterValue={counterValue}
                nextStepTitle={nextStepTitle}
                nextStepSummary={nextStepSummary}
              />

              {/* কাউন্টার ধাপের ভেতরে (StepDetail > CircuitControl) থাকে;
                  InstructionCard-এর চিপ ও প্রতি-চক্কর টিপ উপরে দৃশ্যমান। */}

              <StepDetail step={step} counterValue={counterValue} />

              <div className="pt-1 border-t border-border/40">
                <LostGroupHelper />
              </div>

              {/* নেভিগেশন নিচে — ধাপের তথ্য পড়ার পর এগিয়ে যাওয়ার সুস্পষ্ট অ্যাকশন। */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentIndex === 0}
                  className="border-border bg-muted/60 text-foreground hover:bg-muted"
                >
                  <ChevronLeft className="w-4 h-4" /> পেছনে
                </Button>
                <Button
                  size="sm"
                  onClick={handleNext}
                  disabled={isLast}
                  className="ml-auto bg-primary hover:bg-primary-hover text-primary-foreground border-0 gap-1"
                >
                  পরবর্তী ধাপ <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">একটি ধাপ নির্বাচন করুন</p>
          )}
        </div>
      </div>
    </div>
  );
}
