"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { arcState, type ArcState } from "@/lib/map/umrah-overlay";
import { toBengaliNumber } from "@/lib/utils/bengali-number";

/**
 * CircuitProgress — একটি একক চক্কর/পাক-অগ্রগতি উপাদান, তিনটি স্কেলে (map HUD / sheet
 * inline / stepper ring) একই রং, আইকন ও লজিক ব্যবহার করে।
 *
 * এটি আগের তিনটি পৃথক উইজেটকে (`RoundDots` + `ProgressRing` + `RitualRoundHud`-এর
 * ডট স্ট্রিপ) একত্রিত করে, যাতে "completed" ও "active" অবস্থা আর `emerald-400` বনাম
 * `emerald-500` / `teal-400` বনাম `teal-500` কোলাশ না করে। রঙ সবজায়গায় টোকেন-ভিত্তিক:
 *
 *   completed → `--map-route-completed` (#9AC7BA) + ✓
 *   active    → `--primary` (#0F5C4D) + স্পন্দন
 *   future    → `--map-route-upcoming` (#B8BDB9), ফাঁপা
 *
 * অবস্থা নির্ধারিত হয় `arcState` দিয়ে (1-ভিত্তিক `value` → 0-ভিত্তিক সূচক)।
 * বিশুদ্ধ উপস্থাপনমূলক; prefers-reduced-motion-এ অ্যানিমেশন CSS-এ নিষ্ক্রিয়।
 */

// ---------------------------------------------------------------------------
// Dot-strip variants (HUD compact + sheet inline)
// ---------------------------------------------------------------------------

export type DotSize = "compact" | "inline";

const DOT_BOX: Record<DotSize, string> = {
  // HUD: tiny 8px dots (top-center overlay, glanceable)
  compact: "h-2 w-2",
  // Inline: 16px box (beside counter in sheet)
  inline: "h-4 w-4",
};

const DOT_STATE: Record<ArcState, string> = {
  completed: "bg-map-route-completed text-white",
  active: "bg-primary text-white ritual-hud-dot-active",
  future: "border border-map-route-upcoming bg-transparent",
};

interface DotsProps {
  value: number;
  max: number;
  size?: DotSize;
  /** Show a check icon on completed dots (inline only — too small for compact). */
  withCheck?: boolean;
  /** Decorative (aria-hidden) when the numeric counter elsewhere carries the signal. */
  ariaHidden?: boolean;
  className?: string;
}

/** চক্কর/পাকের N-পয়েন্ট ডট স্ট্রিপ। `round-complete` অ্যানিমেশন সদ্য-সম্পন্ন পয়েন্টে চলে। */
export function CircuitDots({
  value,
  max,
  size = "inline",
  withCheck = true,
  ariaHidden = true,
  className,
}: DotsProps) {
  const done = value >= max;
  const prevRef = React.useRef(value);
  const [justCompleted, setJustCompleted] = React.useState<number | null>(null);

  React.useEffect(() => {
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

  const showCheck = withCheck && size === "inline";

  return (
    <div className={cn("flex items-center gap-1.5", className)} aria-hidden={ariaHidden}>
      {Array.from({ length: max }, (_, i) => {
        const state: ArcState = done ? "completed" : arcState(i, value, max);
        const celebrate = state === "completed" && i === justCompleted;
        return (
          <span
            key={i}
            className={cn(
              "flex items-center justify-center rounded-full",
              DOT_BOX[size],
              DOT_STATE[state],
              celebrate && "round-complete"
            )}
          >
            {state === "completed" && showCheck && <Check className="h-3 w-3" strokeWidth={3} />}
          </span>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ring variant (stepper)
// ---------------------------------------------------------------------------

interface RingProps {
  value: number;
  max: number;
  /** Pixel size of the ring (default 56). */
  size?: number;
}

/** অগ্রগতি রিং (SVG) - +/- স্টেপারের কেন্দ্রে, বাংলা সংখ্যায় value/max। */
export function CircuitRing({ value, max, size = 56 }: RingProps) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, value / max));
  const offset = circ * (1 - ratio);
  const done = value >= max;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${toBengaliNumber(value)} / ${toBengaliNumber(max)}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-map-route-upcoming"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className={done ? "text-map-route-completed" : "text-primary"}
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <span className="absolute text-xs font-bold text-foreground">
        {toBengaliNumber(value)}/{toBengaliNumber(max)}
      </span>
    </div>
  );
}
