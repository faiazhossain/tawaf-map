"use client";

import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import { useUmrahGuideStore } from "@/lib/store/umrahGuideStore";
import { isStepComplete } from "@/lib/data/umrah/sequence";
import type { UmrahStep } from "@/types/umrah";

/** তালিকার একটি সারি - ক্রম নম্বর/টিক, শিরোনাম, কাউন্টার। ট্যাপে সেই ধাপে যায়। */
function StepRow({
  step,
  index,
  isActive,
  isDone,
  counterValue,
  onClick,
}: {
  step: UmrahStep;
  index: number;
  isActive: boolean;
  isDone: boolean;
  counterValue: number;
  onClick: () => void;
}) {
  const counterText =
    step.counter && counterValue > 0
      ? `${toBengaliNumber(counterValue)}/${toBengaliNumber(step.counter.max)}`
      : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all",
        isActive
          ? "bg-teal-500/15 border-teal-500/60"
          : isDone
            ? "bg-emerald-500/5 border-emerald-500/20"
            : "bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/70"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
          isDone
            ? "bg-emerald-500 text-white"
            : isActive
              ? "bg-teal-500 text-white ring-2 ring-teal-400/40"
              : "bg-slate-700 text-slate-300"
        )}
      >
        {isDone ? <Check className="w-4 h-4" /> : toBengaliNumber(index + 1)}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate",
            isActive ? "text-white" : isDone ? "text-emerald-300" : "text-slate-200"
          )}
        >
          {step.title.bn}
        </p>
        {counterText && <p className="text-[11px] text-teal-300">{counterText}</p>}
      </div>
      {isActive && <ChevronRight className="w-4 h-4 text-teal-400 flex-shrink-0" />}
    </button>
  );
}

/**
 * ধাপের তালিকা - সব ধাপের সারি; ট্যাপে সেই ধাপে জাম্প করে। সম্পন্ন/সক্রিয়/বাকি অবস্থাসহ।
 * steps প্রপ হিসেবে পায় (অর্কেস্ট্রেটর থেকে memoized)।
 */
export function GuideStepList({ steps, className }: { steps: UmrahStep[]; className?: string }) {
  const currentIndex = useUmrahGuideStore((s) => s.currentIndex);
  const counters = useUmrahGuideStore((s) => s.counters);
  const completed = useUmrahGuideStore((s) => s.completed);
  const goToStep = useUmrahGuideStore((s) => s.goToStep);

  return (
    <div className={cn("space-y-1.5", className)}>
      {steps.map((step, index) => {
        const cv = counters[step.id] ?? step.counter?.min ?? 0;
        const done = isStepComplete(step, cv, !!completed[step.id]);
        return (
          <StepRow
            key={step.id}
            step={step}
            index={index}
            isActive={index === currentIndex}
            isDone={done}
            counterValue={cv}
            onClick={() => goToStep(index)}
          />
        );
      })}
    </div>
  );
}
