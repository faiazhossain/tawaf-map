"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import { useUmrahGuideStore } from "@/lib/store/umrahGuideStore";
import { isStepComplete } from "@/lib/data/umrah/sequence";
import type { UmrahStep } from "@/types/umrah";

/**
 * পেজিনেশন স্ট্রিপ - এক ধাপে একটি করে চিহ্ন, শুধু বর্তমান ধাপের অবস্থান দেখায়।
 * অ্যাকর্ডিয়ন তালিকার বদলে এটি গাইডের উপরে থাকে: সম্পন্ন ধাপ সবুজ টিক, বর্তমান ধাপ
 * প্রাথমিক রঙ + রিং, বাকি ধাপ ম্লান। যেকোনো চিহ্নে ট্যাপ করলে সেই ধাপে
 * যাওয়া যায় (goToStep)। ৯টি ধাপ সহজেই এক সারিতে খাপ খায়; সরু স্ক্রিনে প্রয়োজনে মোড়ায়।
 *
 * বিশুদ্ধ উপস্থাপনমূলক; অবস্থা স্টোর থেকে পড়ে।
 */
export function StepPagination({ steps, className }: { steps: UmrahStep[]; className?: string }) {
  const currentIndex = useUmrahGuideStore((s) => s.currentIndex);
  const counters = useUmrahGuideStore((s) => s.counters);
  const completed = useUmrahGuideStore((s) => s.completed);
  const goToStep = useUmrahGuideStore((s) => s.goToStep);

  if (steps.length === 0) return null;

  const total = steps.length;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-primary">
          ধাপ {toBengaliNumber(currentIndex + 1)} / {toBengaliNumber(total)}
        </p>
        <p className="truncate pl-2 text-[11px] text-muted-foreground">
          {steps[currentIndex]?.title.bn ?? ""}
        </p>
      </div>

      <div
        className="flex flex-wrap items-center justify-center gap-1.5"
        role="tablist"
        aria-label="ওমরাহর ধাপসমূহ"
      >
        {steps.map((step, index) => {
          const cv = counters[step.id] ?? step.counter?.min ?? 0;
          const done = isStepComplete(step, cv, !!completed[step.id]);
          const isActive = index === currentIndex;

          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? "step" : undefined}
              aria-label={`ধাপ ${toBengaliNumber(index + 1)}: ${step.title.bn}`}
              onClick={() => goToStep(index)}
              className={cn(
                "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                done
                  ? "bg-map-route-completed text-primary-foreground"
                  : isActive
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
              )}
            >
              {done ? <Check className="h-3 w-3" /> : toBengaliNumber(index + 1)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
