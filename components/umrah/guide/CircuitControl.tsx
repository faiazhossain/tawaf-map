"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUmrahGuideStore, selectCounter } from "@/lib/store/umrahGuideStore";
import { ProgressRing } from "./ProgressRing";
import type { UmrahStep } from "@/types/umrah";

/**
 * চক্কর/পাক কাউন্টার নিয়ন্ত্রণ - +/- বোতাম, অগ্রগতি রিং ও বর্তমান সংখ্যা।
 * নির্দেশনা টেক্সট InstructionCard-এ দেখানো হয়, তাই এখানে পুনরায় দেখানো হয় না।
 * বর্তমান ধাপের কাউন্টার সরাসরি স্টোর থেকে পড়ে।
 */
export function CircuitControl({ step }: { step: UmrahStep }) {
  const counter = step.counter;
  const value = useUmrahGuideStore((s) => (counter ? selectCounter(s, step.id) : 0));
  const increment = useUmrahGuideStore((s) => s.incrementCounter);
  const decrement = useUmrahGuideStore((s) => s.decrementCounter);

  if (!counter) return null;

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
      <Button
        variant="outline"
        size="icon"
        onClick={() => decrement(step.id)}
        disabled={value <= counter.min}
        className="h-11 w-11 rounded-full border-border bg-muted hover:bg-muted text-foreground"
        aria-label="কমান"
      >
        <Minus className="w-5 h-5" />
      </Button>

      <div className="flex flex-col items-center">
        <ProgressRing value={value} max={counter.max} />
        <p className="text-[11px] text-muted-foreground mt-1">{counter.label.bn}</p>
      </div>

      <Button
        size="icon"
        onClick={() => increment(step.id)}
        disabled={value >= counter.max}
        className="h-11 w-11 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground border-0"
        aria-label="বাড়ান"
      >
        <Plus className="w-5 h-5" />
      </Button>
    </div>
  );
}
