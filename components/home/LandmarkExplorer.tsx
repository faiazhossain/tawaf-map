"use client";

import * as React from "react";
import { Reveal } from "./Reveal";
import { TawafMapPreview } from "./TawafMapPreview";
import { UMRAH_ANCHORS } from "@/lib/data/umrah/anchors";
import { cn } from "@/lib/utils";

// A focused subset for the homepage explorer — the landmarks a pilgrim
// actually navigates by during Tawaf.
const SHOWN = ["black-stone", "rukn-yamani", "maqam-ibrahim", "hateem", "kaaba"] as const;

type Landmark = (typeof UMRAH_ANCHORS)[number];

const LANDMARKS: Landmark[] = SHOWN.map((id) => UMRAH_ANCHORS.find((a) => a.id === id)!);

const ROLE_HINT: Record<string, React.ReactNode> = {
  kaaba: (
    <div className="space-y-3">
      <p>
        তাওয়াফের কেন্দ্র হলো কাবা শরীফ। কাবাকে আপনার <strong>বাম পাশে রেখে</strong> তার চারপাশে
        সাতটি চক্কর সম্পন্ন করুন।
      </p>
      <p>প্রতিটি চক্কর হাজরে আসওয়াদের সমান্তরাল স্থান থেকে শুরু ও শেষ হয়।</p>
    </div>
  ),
  "tawaf-start": (
    <div className="space-y-3">
      <p>
        প্রতিটি চক্কর হাজরে আসওয়াদের সমান্তরাল স্থান থেকে শুরু করুন। সম্ভব হলে হাজরে আসওয়াদ চুম্বন
        বা স্পর্শ করা সুন্নাহ। তা সম্ভব না হলে দূর থেকে ডান হাত দিয়ে ইশারা করে{" "}
        <strong>“আল্লাহু আকবার”</strong>
        বলুন।
      </p>
      <p>
        <strong>মনে রাখুন:</strong> হাজরে আসওয়াদ চুম্বন বা স্পর্শ করা তাওয়াফের জন্য আবশ্যক নয়।
        ভিড়ের মধ্যে ধাক্কাধাক্কি করে এটি স্পর্শ বা চুম্বনের চেষ্টা করবেন না।
      </p>
    </div>
  ),
  "tawaf-corner": (
    <div className="space-y-3">
      <p>
        সম্ভব হলে রুকনে ইয়ামানি হাত দিয়ে স্পর্শ করুন। এটি সুন্নাহ। স্পর্শ করা সম্ভব না হলে কোনো
        ইশারা বা বিশেষ কিছু করার প্রয়োজন নেই—শুধু তাওয়াফ চালিয়ে যান।
      </p>
      <p>
        <strong>মনে রাখুন:</strong> রুকনে ইয়ামানি চুম্বন করা বা দূর থেকে ইশারা করা সুন্নাহ নয়।
      </p>
    </div>
  ),
  "pray-after-tawaf":
    "সাত চক্কর তাওয়াফ শেষ করার পর দুই রাকাত নামাজ আদায় করুন। সম্ভব হলে মাকামে ইবরাহিমের পেছনে নামাজ পড়ুন। ভিড় থাকলে মসজিদুল হারামের অন্য উপযুক্ত স্থানেও নামাজ আদায় করা যায়।",
  hateem: (
    <div className="space-y-3">
      <p>
        হাতিমের <strong>বাইরের দিক দিয়ে</strong> তাওয়াফ করুন। হাতিমের ভেতর দিয়ে গেলে তাওয়াফ
        সম্পূর্ণ হবে না, কারণ এই অংশটি মূল কাবার অন্তর্ভুক্ত।
      </p>
      <p>
        <strong>মনে রাখুন:</strong> তাওয়াফের সময় কাবা ও হাতিম—দুটোকেই আপনার বাম পাশে রেখে চলুন।
      </p>
    </div>
  ),
};

export function LandmarkExplorer() {
  const [activeId, setActiveId] = React.useState<string>("black-stone");
  const active = LANDMARKS.find((l) => l.id === activeId)!;

  return (
    <section id="landmarks" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold text-primary">চিহ্নিত স্থান</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          তওয়াফের গুরুত্বপূর্ণ স্থানগুলো দেখুন
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          ম্যাপে একটি স্থান নির্বাচন করে সেটি বিস্তারিতভাবে দেখুন। তওয়াফের সময় আপনার অবস্থান ও
          চলার পথ বুঝতে এই চিহ্নিত স্থানগুলো সাহায্য করবে।
        </p>
      </Reveal>

      <div className="mt-12 grid items-center gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        {/* Map */}
        <Reveal>
          <div
            id="map"
            className="relative rounded-3xl border border-border bg-surface p-4 shadow-sm sm:p-6"
          >
            <TawafMapPreview interactive highlightLandmark={activeId} activeRound={3} />
            <div className="pointer-events-none absolute left-6 top-6 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              নকশামাত্র · মাতাফ, মসজিদুল হারাম
            </div>
          </div>
        </Reveal>

        {/* Cards + detail */}
        <div>
          <Reveal>
            <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
              {LANDMARKS.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(l.id)}
                    aria-pressed={l.id === activeId}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors",
                      l.id === activeId
                        ? "border-primary bg-primary-soft"
                        : "border-border bg-surface hover:border-primary/30"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1 inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full",
                        l.id === "kaaba" || l.role === "tawaf-start" ? "bg-gold" : "bg-map-landmark"
                      )}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-foreground">
                        {l.name.bn}
                      </span>
                      <span
                        className="mt-0.5 block font-arabic text-sm text-muted-foreground"
                        dir="rtl"
                      >
                        {l.nameAr}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={80}>
            <div className="mt-4 rounded-2xl border border-border bg-surface-muted/60 p-5">
              <p className="text-xs font-semibold text-primary">নির্দেশনা</p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">{active.name.bn}</h3>
              <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {ROLE_HINT[active.role]}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
