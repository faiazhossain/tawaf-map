"use client";

import { LifeBuoy, RotateCcw, Compass } from "lucide-react";
import { OfflineBadge } from "@/components/umrah/OfflineBadge";
import { useUmrahGuideStore } from "@/lib/store/umrahGuideStore";
import { isStepComplete } from "@/lib/data/umrah/sequence";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import type { UmrahStep } from "@/types/umrah";

/**
 * গাইডের ওপরের নিয়ন্ত্রণ বার - সামগ্রিক অগ্রগতি বার ও বোতাম (অফলাইন, মিকাত,
 * ভুল-সহায়ক, রিসেট)। মোবাইলে expanded ও ডেস্কটপ প্যানেলে দৃশ্যমান।
 */
export function GuideControls({
  steps,
  onOpenMiqatOverview,
  onOpenMistake,
  className,
}: {
  steps: UmrahStep[];
  onOpenMiqatOverview?: () => void;
  onOpenMistake: () => void;
  className?: string;
}) {
  const counters = useUmrahGuideStore((s) => s.counters);
  const completed = useUmrahGuideStore((s) => s.completed);
  const reset = useUmrahGuideStore((s) => s.reset);

  const doneCount = steps.filter((s) => {
    const cv = counters[s.id] ?? s.counter?.min ?? 0;
    return isStepComplete(s, cv, !!completed[s.id]);
  }).length;
  const progress = steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0;

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-teal-300">
          {toBengaliNumber(doneCount)} / {toBengaliNumber(steps.length)} ধাপ সম্পন্ন
        </p>
        <div className="flex items-center gap-1">
          <OfflineBadge />
          {onOpenMiqatOverview && (
            <button
              onClick={onOpenMiqatOverview}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-teal-500/15 text-teal-300 hover:bg-teal-500/25 transition-colors"
              title="মিকাত সারসংক্ষেপ মানচিত্র"
            >
              <Compass className="w-3.5 h-3.5" />
              মিকাত
            </button>
          )}
          <button
            onClick={onOpenMistake}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-colors"
            title="আমি একটি ভুল করেছি"
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            ভুল করেছি?
          </button>
          <button
            onClick={() => {
              if (confirm("গাইড রিসেট করবেন? আপনার অগ্রগতি মুছে যাবে।")) reset();
            }}
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-md hover:bg-slate-800 transition-colors"
            aria-label="রিসেট"
            title="রিসেট"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
