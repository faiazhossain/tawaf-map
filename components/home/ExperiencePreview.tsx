"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./Reveal";
import { TawafMapPreview } from "./TawafMapPreview";
import { cn } from "@/lib/utils";
import { toBengaliNumber } from "@/lib/utils/bengali-number";

const ROUNDS = 7;

/**
 * Product preview — a faithful mock of the in-app guided experience: a
 * mini-map, a round tracker, and a live instruction bar. Shows users exactly
 * what they will see before they tap "Start Tawaf".
 */
export function ExperiencePreview() {
  const [round, setRound] = React.useState(3);

  // Subtle auto-advance to feel "live", paused on hover / reduced motion.
  const [paused, setPaused] = React.useState(false);
  React.useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setRound((r) => (r >= ROUNDS ? 1 : r + 1));
    }, 2600);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <section className="bg-surface-muted/40 border-y border-border">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <Reveal>
            <p className="text-sm font-semibold text-primary">অভিজ্ঞতা</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              তওয়াফের সময় যা দেখবেন
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              চলমান চক্কর, পরবর্তী নির্দেশনা এবং আপনার সামনে থাকা পথ—সবকিছু এক স্ক্রিনেই। যখন যা
              জানা দরকার, ঠিক তখনই তা সহজভাবে দেখানো হবে।
            </p>

            <ul className="mt-6 space-y-2.5">
              {(
                [
                  ["বর্তমান চক্কর", " — সাতটির মধ্যে আপনি কোন চক্করে আছেন"],
                  ["পরবর্তী নির্দেশনা", " — পরবর্তী কী করতে হবে, সহজ ভাষায়"],
                  ["তাওয়াফের পথ", " — আপনি যে পথে এগিয়ে যাবেন, তা স্পষ্টভাবে চিহ্নিত"],
                  [
                    "গুরুত্বপূর্ণ স্থান",
                    " — কাছে পৌঁছালে স্থানটির নাম ও প্রয়োজনীয় নির্দেশনা দেখুন",
                  ],
                ] as const
              ).map(([label, rest]) => (
                <li key={label} className="flex items-start gap-2.5 text-sm text-foreground">
                  <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  <span>
                    <strong className="font-semibold">{label}</strong>
                    {rest}
                  </span>
                </li>
              ))}
            </ul>

            <Link href="/map" className="mt-7 inline-block">
              <Button className="gap-1.5 rounded-full">
                গাইড দেখুন
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Reveal>

          {/* Mock device */}
          <Reveal delay={80}>
            <div
              className="mx-auto w-full max-w-sm"
              onPointerEnter={() => setPaused(true)}
              onPointerLeave={() => setPaused(false)}
            >
              <div className="overflow-hidden rounded-[28px] border border-border bg-surface shadow-xl">
                {/* Mock status / title bar */}
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">তওয়াফ</p>
                    <p className="text-sm font-semibold text-foreground">
                      {toBengaliNumber(round)} / ৭ চক্কর
                    </p>
                  </div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Navigation className="h-4 w-4" />
                  </span>
                </div>

                {/* Mini map */}
                <div className="bg-surface-muted/50 p-5">
                  <TawafMapPreview activeRound={round} staticPilgrim={false} />
                </div>

                {/* Round tracker */}
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    {Array.from({ length: ROUNDS }, (_, i) => i + 1).map((r) => {
                      const state = r < round ? "done" : r === round ? "current" : "future";
                      return (
                        <span
                          key={r}
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                            state === "done" && "bg-primary/15 text-primary",
                            state === "current" && "bg-primary text-primary-foreground shadow-sm",
                            state === "future" && "bg-surface-muted text-muted-foreground"
                          )}
                        >
                          {state === "done" ? "✓" : toBengaliNumber(r)}
                        </span>
                      );
                    })}
                  </div>

                  {/* Instruction */}
                  <div className="mt-4 rounded-xl border border-border bg-background p-4">
                    <p
                      key={round}
                      className="instruction-crossfade text-sm font-medium leading-relaxed text-foreground"
                    >
                      বাম দিকে ঘুরে হাঁটতে থাকুন। কাবা রাখুন বাম কাঁধে।
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      এরপর: ইয়েমেনি কোণার দিকে এগিয়ে যান
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
