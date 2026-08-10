"use client";

import { cn } from "@/lib/utils";

/**
 * ProgressBar — একটি একক অগ্রগতি-বার আদিম। আগে GuideControls (সামগ্রিক ধাপ) ও
 * GuidePeek (চক্কর কাউন্টার) পৃথক মার্কআপ ব্যবহার করত; এখন উভয় এটি ব্যবহার করে।
 *
 * বিশুদ্ধ উপস্থাপনমূলক; `bg-primary` পূরণ ও `bg-muted` ট্র্যাক (টোকেন-ভিত্তিক)।
 */
export function ProgressBar({
  /** 0..1 অনুপাত; সীমার বাইরে clamp করা হয়। */
  value,
  className,
  trackClassName,
  fillClassName,
  style,
}: {
  value: number;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
  style?: React.CSSProperties;
}) {
  const ratio = Math.max(0, Math.min(1, value));
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-muted",
        trackClassName,
        className
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(ratio * 100)}
      style={style}
    >
      <div
        className={cn("h-full rounded-full bg-primary transition-all duration-500", fillClassName)}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}
