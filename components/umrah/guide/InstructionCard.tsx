"use client";

import { Navigation2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import { stageLabel, directionHint } from "./stage-label";
import type { UmrahStep } from "@/types/umrah";

/**
 * হিরো "একটি নির্দেশ" কার্ড - "এখন কী করব?" এক নজরে উত্তর।
 * কাউন্টার ধাপে বর্তমান চক্করের নির্দেশনা (perRoundTips[current-1]) দেখায়, অন্যথা
 * ধাপের সারসংক্ষেপ। ধাপ/চক্কর বদলালে নির্দেশনা টেক্সট হালকা ক্রসফেড করে
 * (key পরিবর্তনে React রিমাউন্ট করে animate-in পুনরায় চালায়)।
 *
 * বিশুদ্ধ উপস্থাপনমূলক - step ও counterValue প্রপ হিসেবে পায়, সহজে পরীক্ষাযোগ্য।
 */
export function InstructionCard({
  step,
  counterValue,
  className,
}: {
  step: UmrahStep;
  counterValue: number;
  className?: string;
}) {
  const counter = step.counter;
  const tip =
    counter?.perRoundTips && counterValue >= 1
      ? counter.perRoundTips[Math.min(counterValue - 1, counter.max - 1)]
      : null;
  const instruction = tip?.bn ?? step.summary.bn;
  const direction = directionHint(step.stage);
  const chip = counter
    ? `${counter.label.bn} ${toBengaliNumber(counterValue)}/${toBengaliNumber(counter.max)}`
    : step.title.bn;

  return (
    <section
      className={cn("rounded-2xl border border-teal-500/30 bg-slate-800/50 p-4", className)}
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-300">
          {stageLabel(step.stage)}
        </p>
        <span className="text-[11px] font-medium text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded-full">
          {chip}
        </span>
      </div>

      {/* নির্দেশনা - key পরিবর্তনে হালকা fade+slide ক্রসফেড */}
      <div key={`${step.id}-${counterValue}`} className="mt-2 instruction-crossfade">
        <p className="text-base font-semibold leading-snug text-white">{instruction}</p>
        {direction && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-teal-300">
            <Navigation2 className="h-3.5 w-3.5" />
            {direction}
          </p>
        )}
      </div>
    </section>
  );
}
