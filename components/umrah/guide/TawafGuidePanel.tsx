"use client";

import { useMemo } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUmrahGuideStore, selectCurrentStep, selectCounter } from "@/lib/store/umrahGuideStore";
import { getStepById } from "@/lib/data/umrah/steps";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import { InstructionCard } from "./InstructionCard";
import { CircuitControl } from "./CircuitControl";
import { GuideControls } from "./GuideControls";
import { GuideStepList } from "./GuideStepList";
import { GuideExpanded } from "./GuideExpanded";
import { RoundDots } from "./RoundDots";

interface TawafGuidePanelProps {
  onOpenChange: (open: boolean) => void;
  onOpenMiqatOverview?: () => void;
  onOpenMistake: () => void;
}

/**
 * ডেস্কটপ গাইডেড প্যানেল - ডানদিকে সরু ভাসমান প্যানেল। হিরো নির্দেশ ওপরে, নিচে
 * সম্পূর্ণ বিস্তারিত স্ক্রলযোগ্য। বটম শীট নেই - সব ধাপ একসাথে দৃশ্যমান।
 */
export function TawafGuidePanel({
  onOpenChange,
  onOpenMiqatOverview,
  onOpenMistake,
}: TawafGuidePanelProps) {
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

  const isLast = currentIndex >= steps.length - 1;
  const counter = step?.counter;

  return (
    <div
      className="absolute top-4 right-4 z-[100] w-96 h-[calc(100vh-7rem)]"
      data-testid="umrah-step-list-desktop"
    >
      <div className="flex flex-col h-full overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/95 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-gradient-to-r from-teal-600/20 to-cyan-600/10">
          <h3 className="text-base font-bold text-white">ওমরাহ গাইড</h3>
          <button
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            বন্ধ
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
          <GuideControls
            steps={steps}
            onOpenMiqatOverview={onOpenMiqatOverview}
            onOpenMistake={onOpenMistake}
          />

          {step ? (
            <>
              <InstructionCard step={step} counterValue={counterValue} />

              {counter && (
                <>
                  <CircuitControl step={step} />
                  <div className="flex items-center justify-between">
                    <RoundDots value={counterValue} max={counter.max} />
                    <span className="text-[11px] text-slate-400">
                      {counter.label.bn} {toBengaliNumber(counterValue)}/
                      {toBengaliNumber(counter.max)}
                    </span>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
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
                  onClick={nextStep}
                  disabled={isLast}
                  className="ml-auto bg-teal-600 hover:bg-teal-500 text-white border-0 gap-1"
                >
                  পরবর্তী ধাপ <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <GuideStepList steps={steps} />

              <div className="pt-1 border-t border-slate-700/40">
                <GuideExpanded />
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-slate-400 py-8">একটি ধাপ নির্বাচন করুন</p>
          )}
        </div>
      </div>
    </div>
  );
}
