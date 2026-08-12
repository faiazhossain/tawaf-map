"use client";

import { LifeBuoy, RotateCcw, Compass, Target } from "lucide-react";
import { OfflineBadge } from "@/components/umrah/OfflineBadge";
import { ProgressBar } from "@/components/ui/progress";
import { useUmrahGuideStore } from "@/lib/store/umrahGuideStore";
import { isStepComplete, findNextIncompleteIndex } from "@/lib/data/umrah/sequence";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import type { UmrahStep } from "@/types/umrah";

/**
 * গাইডের ওপরের নিয়ন্ত্রণ বার - সামগ্রিক অগ্রগতি বার ও বোতাম (অফলাইন, মিকাত,
 * ভুল-সহায়ক, রিসেট)। মোবাইলে expanded ও ডেস্কটপ প্যানেলে দৃশ্যমান।
 *
 * "পরবর্তী অসম্পন্ন ধাপ" বোতামটি findNextIncompleteIndex অ্যাকশন প্রকাশ করে — ধাপ-তালিকা
 * থেকে ঘুরে এলে বা কোনো ধাপ এড়িয়ে গেলে পরবর্তী অসম্পন্ন ধাপে ফিরে যাওয়ার উপায়।
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
  const goToNextIncomplete = useUmrahGuideStore((s) => s.goToNextIncomplete);
  const currentIndex = useUmrahGuideStore((s) => s.currentIndex);

  const doneCount = steps.filter((s) => {
    const cv = counters[s.id] ?? s.counter?.min ?? 0;
    return isStepComplete(s, cv, !!completed[s.id]);
  }).length;
  const progress = steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0;
  const nextIncomplete = findNextIncompleteIndex(steps, counters, completed);
  // শুধু তখনই দেখাও যখন ব্যবহারকারী বর্তমানে সেই ধাপে নেই যেটা পরবর্তী অসম্পন্ন।
  const showJumpToIncomplete = nextIncomplete !== -1 && nextIncomplete !== currentIndex;

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-primary">
          {toBengaliNumber(doneCount)} / {toBengaliNumber(steps.length)} ধাপ সম্পন্ন
        </p>
        <div className="flex items-center gap-1">
          <OfflineBadge />
          {onOpenMiqatOverview && (
            <button
              onClick={onOpenMiqatOverview}
              className="flex h-8 items-center gap-1 text-[11px] px-2 rounded-md bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
              title="মিকাত সারসংক্ষেপ মানচিত্র"
              aria-label="মিকাত সারসংক্ষেপ"
            >
              <Compass className="w-3.5 h-3.5" />
              মিকাত
            </button>
          )}
          <button
            onClick={onOpenMistake}
            className="flex h-8 items-center gap-1 text-[11px] px-2 rounded-md bg-gold/15 text-gold hover:bg-gold/25 transition-colors"
            title="আমি একটি ভুল করেছি"
            aria-label="ভুল সহায়ক খুলুন"
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            ভুল করেছি?
          </button>
          <button
            onClick={() => {
              if (confirm("গাইড রিসেট করবেন? আপনার অগ্রগতি মুছে যাবে।")) reset();
            }}
            className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-error rounded-md hover:bg-muted transition-colors"
            aria-label="রিসেট"
            title="রিসেট"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
      <ProgressBar className="mt-2" value={progress / 100} />
      {showJumpToIncomplete && (
        <button
          onClick={goToNextIncomplete}
          className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-primary-soft px-2 text-[11px] font-medium text-primary transition-colors hover:bg-primary/15"
          title="পরবর্তী অসম্পন্ন ধাপে যান"
        >
          <Target className="h-3.5 w-3.5" />
          পরবর্তী অসম্পন্ন ধাপ
        </button>
      )}
    </div>
  );
}
