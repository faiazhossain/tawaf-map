"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { arcState, type ArcState } from "@/lib/map/umrah-overlay";

/**
 * চক্কর/পাকের ৭-পয়েন্ট ইন্ডিকেটর (তওয়াফ ৭ চক্কর / সাঈ ৭ পাক)।
 * সম্পন্ন = সবুজ + টিক, সক্রিয় = টিল + স্পন্দন, ভবিষ্যৎ = ফাঁপা ধূসর।
 *
 * value বাড়ালে (অর্থাৎ একটি চক্কর সম্পন্ন হলে) সদ্য-সম্পন্ন পয়েন্টে `round-complete`
 * স্কেল-আপ অ্যানিমেশন চালে (~৫০০ms), যাতে "+1" ট্যাপ সংযুক্তভাবে অনুভূত হয়।
 * অবস্থা arcState থেকে নির্ধারিত; prefers-reduced-motion-এ অ্যানিমেশন CSS-এ নিষ্ক্রিয়।
 */
export function RoundDots({
  value,
  max,
  className,
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const done = value >= max;
  const prevRef = useRef(value);
  const [justCompleted, setJustCompleted] = useState<number | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = value;
    // value বাড়লে সদ্য-সম্পন্ন পয়েন্ট = value-2 (১-ভিত্তিক → ০-ভিত্তিক সূচক)
    if (value > prev && value >= 2) {
      const idx = value - 2;
      setJustCompleted(idx);
      const t = window.setTimeout(() => setJustCompleted(null), 600);
      return () => window.clearTimeout(t);
    }
  }, [value]);

  return (
    <div className={cn("flex items-center gap-1.5", className)} aria-hidden="true">
      {Array.from({ length: max }, (_, i) => {
        const state: ArcState = done ? "completed" : arcState(i, value, max);
        const celebrate = state === "completed" && i === justCompleted;
        return (
          <span
            key={i}
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded-full",
              state === "completed" && "bg-emerald-500 text-white",
              state === "active" && "bg-teal-500 text-white ritual-hud-dot-active",
              state === "future" && "border border-slate-600 bg-transparent",
              celebrate && "round-complete"
            )}
          >
            {state === "completed" && <Check className="h-3 w-3" strokeWidth={3} />}
          </span>
        );
      })}
    </div>
  );
}
