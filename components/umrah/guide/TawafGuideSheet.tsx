"use client";

import { useMemo } from "react";
import { ChevronRight, ChevronLeft, ChevronsUp } from "lucide-react";
import { BottomSheet, useBottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { useUmrahGuideStore, selectCurrentStep, selectCounter } from "@/lib/store/umrahGuideStore";
import { getStepById } from "@/lib/data/umrah/steps";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import { InstructionCard } from "./InstructionCard";
import { CircuitControl } from "./CircuitControl";
import { GuidePeek } from "./GuidePeek";
import { GuideControls } from "./GuideControls";
import { GuideStepList } from "./GuideStepList";
import { GuideExpanded } from "./GuideExpanded";
import { RoundDots } from "./RoundDots";
import { stageLabel } from "./stage-label";

interface TawafGuideSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenMiqatOverview?: () => void;
  onOpenMistake: () => void;
}

/**
 * মোবাইল গাইডেড শীট - তিন স্ন্যাপ অবস্থা: peek (এক লাইন), normal (হিরো নির্দেশ +
 * কাউন্টার + পরবর্তী), expanded (সম্পূর্ণ বিস্তারিত + ধাপের তালিকা)। ব্যাকড্রপ ছাড়া, যাতে
 * মানচিত্র সবসময় দৃশ্যমান থাকে। বাংলা-প্রথম, টিল থিম।
 */
export function TawafGuideSheet({
  open,
  onOpenChange,
  onOpenMiqatOverview,
  onOpenMistake,
}: TawafGuideSheetProps) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[0.12, 0.42, 0.92]}
      defaultSnap={1}
      showBackdrop={false}
    >
      <SheetBody onOpenMiqatOverview={onOpenMiqatOverview} onOpenMistake={onOpenMistake} />
    </BottomSheet>
  );
}

function SheetBody({
  onOpenMiqatOverview,
  onOpenMistake,
}: {
  onOpenMiqatOverview?: () => void;
  onOpenMistake: () => void;
}) {
  const { snapIndex, snapToIndex } = useBottomSheet();
  const step = useUmrahGuideStore(selectCurrentStep);
  const counterValue = useUmrahGuideStore((s) => (step ? selectCounter(s, step.id) : 0));
  const stepIds = useUmrahGuideStore((s) => s.stepIds);
  const currentIndex = useUmrahGuideStore((s) => s.currentIndex);
  const nextStep = useUmrahGuideStore((s) => s.nextStep);
  const prevStep = useUmrahGuideStore((s) => s.prevStep);
  const steps = useMemo(
    () => stepIds.map((id) => getStepById(id)).filter((s): s is NonNullable<typeof s> => !!s),
    [stepIds]
  );

  if (!step) {
    return (
      <div className="px-4 py-8 text-center text-sm text-slate-400">একটি ধাপ নির্বাচন করুন</div>
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

      <InstructionCard step={step} counterValue={counterValue} />

      {counter && <CircuitControl step={step} />}

      {isExpanded ? (
        <>
          {counter && (
            <div className="flex items-center justify-between">
              <RoundDots value={counterValue} max={counter.max} />
              <span className="text-[11px] text-slate-400">
                {counter.label.bn} {toBengaliNumber(counterValue)}/{toBengaliNumber(counter.max)}
              </span>
            </div>
          )}
          <GuideStepList steps={steps} />
          <div className="pt-1 border-t border-slate-700/40">
            <GuideExpanded />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={prevStep}
              disabled={currentIndex === 0}
              className="border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700"
            >
              <ChevronLeft className="w-4 h-4" /> পেছনে
            </Button>
            <Button
              size="sm"
              onClick={() => snapToIndex(1)}
              variant="outline"
              className="ml-auto border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700 gap-1"
            >
              <ChevronsUp className="w-4 h-4" /> সংক্ষেপে
            </Button>
          </div>
        </>
      ) : (
        <>
          <Button
            onClick={() => snapToIndex(2)}
            variant="outline"
            className="w-full justify-center gap-1 border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700"
          >
            <ChevronsUp className="w-4 h-4" /> বিস্তারিত ও ধাপের তালিকা
          </Button>
          <Button
            onClick={nextStep}
            disabled={isLast}
            className="w-full justify-center gap-1 bg-teal-600 hover:bg-teal-500 text-white border-0"
          >
            পরবর্তী ধাপ <ChevronRight className="w-4 h-4" />
          </Button>
          <p className="text-center text-[11px] text-slate-500">
            {stageLabel(step.stage)}
            {counter ? ` · ${toBengaliNumber(counterValue)}/${toBengaliNumber(counter.max)}` : ""}
          </p>
        </>
      )}
    </div>
  );
}
