"use client";

import { CircuitDots } from "./CircuitProgress";

/**
 * চক্কর/পাকের ইনলাইন ৭-পয়েন্ট ইন্ডিকেটর (sheet-এ কাউন্টারের পাশে)।
 *
 * এখন `CircuitDots`-এর একটি পাতলা র‍্যাপার — একই রং, আইকন ও লজিক যা RitualRoundHud
 * (map HUD) ও CircuitRing (stepper)-এ ব্যবহৃত হয়। আগের হার্ডকোডেড `emerald-500`/
 * `teal-500`/`slate-600` টোকেনে স্থানান্তরিত (`--map-route-completed`/`--primary`/
 * `--map-route-upcoming`)।
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
  return (
    <CircuitDots value={value} max={max} size="inline" withCheck ariaHidden className={className} />
  );
}
