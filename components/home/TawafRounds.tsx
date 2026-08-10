"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";
import { toBengaliNumber } from "@/lib/utils/bengali-number";

const ROUNDS = 7;

const ROUND_NOTES: Record<number, string> = {
  1: "ম্যাপে হাজরে আসওয়াদের শুরুর স্থানটি চিহ্নিত করা থাকবে। সবুজ তীর আপনাকে চলার দিক নির্দেশ করবে।",
  2: "ম্যাপে আপনার অবস্থান দেখুন এবং নিশ্চিত করুন, কাবা শরিফ আপনার বাম পাশে রয়েছে।",
  3: "আপনার চলার পথটি ম্যাপে স্পষ্টভাবে দেখানো হবে। নির্ধারিত পথ থেকে সরে গেলে সতর্কবার্তা দেখতে পাবেন।",
  4: "ম্যাপের কাউন্টার থেকে আপনার অগ্রগতি দেখুন। চারটি চক্কর সম্পন্ন হয়েছে কি না, তা সহজেই বুঝতে পারবেন।",
  5: "ইয়েমেনি কোণার কাছে ম্যাপে একটি চিহ্ন দেখতে পাবেন। সেটি অতিক্রম করে তওয়াফ চালিয়ে যান।",
  6: "ম্যাপের কাউন্টারে দেখুন—আর মাত্র দুটি চক্কর বাকি। স্বাভাবিক গতিতে চলতে থাকুন।",
  7: "শেষ চক্কর। সাতটি চক্কর সম্পন্ন হলে ম্যাপে পরবর্তী ধাপের নির্দেশনা দেখতে পাবেন।",
};

/**
 * Seven-round explorer. A circular dial on tablet/desktop; on mobile it
 * recomposes into a horizontal stepper so nothing is cramped at 360px.
 */
export function TawafRounds() {
  const [active, setActive] = React.useState(3);

  return (
    <section id="rounds" className="bg-surface-muted/40 border-y border-border">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-primary">সাত চক্কর</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            একই পথে, সাতটি চক্কর
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            তওয়াফের প্রতিটি চক্কর একই পথ ধরে সম্পন্ন হয়। প্রতিটি চক্কর সম্পন্ন হওয়ার সঙ্গে সঙ্গে
            আপনার অগ্রগতি ম্যাপে দেখতে পারবেন। যেকোনো চক্করে ট্যাপ করে সেই ধাপে কী করতে হবে তা জেনে
            নিন।
          </p>
        </Reveal>

        {/* Desktop / tablet: circular dial */}
        <Reveal className="mt-14 hidden justify-center sm:flex">
          <div className="relative h-[360px] w-[360px]">
            {/* Center caption */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-5xl font-semibold text-foreground">
                {toBengaliNumber(active)}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">চক্কর, মোট ৭টি</span>
            </div>

            {/* Kaaba glyph */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[148px]">
              <div className="h-7 w-6 rounded-[2px] bg-foreground">
                <div className="h-[3px] w-full rounded-[1px] bg-gold" />
              </div>
            </div>

            <RoundDial active={active} onSelect={setActive} />
          </div>
        </Reveal>

        {/* Mobile: horizontal stepper */}
        <Reveal className="mt-10 sm:hidden">
          <div className="-mx-4 overflow-x-auto px-4 pb-2">
            <div className="flex gap-2">
              {Array.from({ length: ROUNDS }, (_, i) => i + 1).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setActive(r)}
                  className={cn(
                    "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                    r === active
                      ? "border-primary bg-primary text-primary-foreground"
                      : r < active
                        ? "border-primary/40 bg-primary-soft text-primary"
                        : "border-border bg-surface text-muted-foreground"
                  )}
                  aria-label={`${toBengaliNumber(r)} চক্কর`}
                  aria-pressed={r === active}
                >
                  {toBengaliNumber(r)}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Active round note */}
        <Reveal className="mx-auto mt-8 max-w-md text-center">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-semibold text-primary">
              {toBengaliNumber(active)} নম্বর চক্কর
            </p>
            <p
              key={active}
              className="instruction-crossfade mt-2 text-base leading-relaxed text-foreground"
            >
              {ROUND_NOTES[active]}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Circular arrangement of seven round buttons positioned around the dial. */
function RoundDial({ active, onSelect }: { active: number; onSelect: (r: number) => void }) {
  const radius = 150;
  return (
    <>
      {Array.from({ length: ROUNDS }, (_, i) => i + 1).map((r) => {
        // Position rounds counter-clockwise starting at the top (12 o'clock).
        const theta = -Math.PI / 2 + ((r - 1) / ROUNDS) * 2 * Math.PI;
        const x = Math.cos(theta) * radius;
        const y = Math.sin(theta) * radius;
        const done = r < active;
        const current = r === active;
        return (
          <button
            key={r}
            type="button"
            onClick={() => onSelect(r)}
            style={{ transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%))` }}
            className={cn(
              "absolute left-1/2 top-1/2 flex h-12 w-12 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-200",
              current
                ? "border-primary bg-primary text-primary-foreground shadow-md scale-110"
                : done
                  ? "border-primary/40 bg-primary-soft text-primary"
                  : "border-border bg-surface text-muted-foreground hover:border-primary/40"
            )}
            aria-label={`${toBengaliNumber(r)} চক্কর`}
            aria-pressed={current}
          >
            {done ? <Check className="h-5 w-5" /> : toBengaliNumber(r)}
            {current && (
              <span className="tawaf-pulse-soft absolute inset-0 rounded-full bg-primary/30" />
            )}
          </button>
        );
      })}
    </>
  );
}
