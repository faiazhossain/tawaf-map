"use client";

import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import { stageLabel, directionHint } from "./stage-label";
import type { UmrahStep } from "@/types/umrah";

/**
 * ভাঁজ করা এক লাইন পিক (peek) - সবচেয়ে কম জায়গা নেয়, বেশিরভাগ মানচিত্র দৃশ্যমান রাখে।
 * কাউন্টার ধাপে "তওয়াফ ৪/৭ · <দিক>" ও একটি ক্ষুদ্র অগ্রগতি বার; ট্যাপ করলে বড় হয়।
 * বিশুদ্ধ উপস্থাপনমূলক।
 */
export function GuidePeek({
  step,
  counterValue,
  onExpand,
  className,
}: {
  step: UmrahStep;
  counterValue: number;
  onExpand: () => void;
  className?: string;
}) {
  const counter = step.counter;
  const ratio = counter ? Math.max(0, Math.min(1, counterValue / counter!.max)) : null;
  const line = counter
    ? `${stageLabel(step.stage)} ${toBengaliNumber(counterValue)}/${toBengaliNumber(counter!.max)}${
        directionHint(step.stage) ? ` · ${directionHint(step.stage)}` : ""
      }`
    : step.summary.bn;

  return (
    <button
      type="button"
      onClick={onExpand}
      className={cn("flex w-full items-center gap-3 px-4 py-2.5 text-left", className)}
      aria-label={`${line} — বিস্তারিত দেখুন`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{line}</p>
        {ratio !== null && (
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${ratio * 100}%` }}
            />
          </div>
        )}
      </div>
      <ChevronUp className="h-4 w-4 flex-shrink-0 text-slate-400" />
    </button>
  );
}
