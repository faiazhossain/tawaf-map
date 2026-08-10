"use client";

import * as React from "react";
import { Compass, Play, Map, Footprints, Check } from "lucide-react";
import { Reveal } from "./Reveal";
import { toBengaliNumber } from "@/lib/utils/bengali-number";

const STEPS = [
  {
    n: toBengaliNumber(1),
    icon: Compass,
    title: "প্রস্তুতি নিন",
    body: "অজু করে মসজিদুল হারামে তওয়াফের জন্য প্রস্তুত হন। TawafMap চালু করে আপনার অবস্থান দেখে নিন।",
  },
  {
    n: toBengaliNumber(2),
    icon: Play,
    title: "তওয়াফ শুরু করুন",
    body: "হাজরে আসওয়াদের দিক থেকে তওয়াফ শুরু করুন। ম্যাপে আপনার শুরুর স্থানটি স্পষ্টভাবে দেখানো হবে।",
  },
  {
    n: toBengaliNumber(3),
    icon: Map,
    title: "ম্যাপ অনুসরণ করে চলুন",
    body: "কাবা শরিফকে বাম পাশে রেখে ঘড়ির কাঁটার বিপরীত দিকে চলুন। আপনার চলার পথটি ম্যাপে স্পষ্টভাবে দেখানো হবে।",
  },
  {
    n: toBengaliNumber(4),
    icon: Footprints,
    title: "সাত চক্কর সম্পন্ন করুন",
    body: "প্রতিটি চক্কর স্বয়ংক্রিয়ভাবে গণনা করা হবে। ম্যাপেই দেখতে পারবেন—কতটি চক্কর সম্পন্ন হয়েছে এবং পরবর্তী ধাপে কী করতে হবে।",
  },
  {
    n: toBengaliNumber(5),
    icon: Check,
    title: "তওয়াফ সম্পন্ন করুন",
    body: "সাত চক্কর শেষ হলে তওয়াফ সম্পন্ন হবে। এরপর মাকামে ইবরাহিমের কাছে দুই রাকাত নামাজ আদায় করুন। পরবর্তী করণীয়ের জন্য TawafMap আপনাকে নির্দেশনা দেবে।",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold text-primary">যেভাবে করবেন</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          শুরু থেকে শেষ পর্যন্ত
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          তওয়াফের পুরো প্রক্রিয়াটি পাঁচটি সহজ ধাপে সাজানো। প্রতিটি ধাপে কী করতে হবে, TawafMap
          আপনাকে তা সহজভাবে দেখিয়ে দেবে।
        </p>
      </Reveal>

      <ol className="mt-14 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-5 lg:gap-4">
        {STEPS.map((step, i) => (
          <Reveal key={step.n} delay={i * 80}>
            <li className="relative flex h-full flex-col rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-sm font-semibold text-muted-foreground/70">
                  {step.n}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>

              {/* Connector arrow on desktop */}
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-2.5 top-1/2 hidden -translate-y-1/2 text-border lg:block"
                >
                  →
                </span>
              )}
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
