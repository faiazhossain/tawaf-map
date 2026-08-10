"use client";

import { CircuitRing } from "./CircuitProgress";

/**
 * অগ্রগতি রিং — +/- স্টেপারের কেন্দ্রে বাংলা সংখ্যায় value/max।
 *
 * এখন `CircuitRing`-এর র‍্যাপার — একই টোকেন রং যা CircuitDots ও RitualRoundHud-এ
 * ব্যবহৃত হয় (আগের `emerald-400`/`teal-400`/`slate-700` সরানো হয়েছে)।
 */
export function ProgressRing({
  value,
  max,
  size = 56,
}: {
  value: number;
  max: number;
  size?: number;
}) {
  return <CircuitRing value={value} max={max} size={size} />;
}
