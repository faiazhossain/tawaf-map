import Link from "next/link";
import { ArrowRight, BookOpen, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/home/Reveal";
import { HomeHeader } from "@/components/home/HomeHeader";
import { Footer } from "@/components/home/Footer";
import { TawafMapPreview } from "@/components/home/TawafMapPreview";
import { HowItWorks } from "@/components/home/HowItWorks";
import { TawafRounds } from "@/components/home/TawafRounds";
import { LandmarkExplorer } from "@/components/home/LandmarkExplorer";
import { ExperiencePreview } from "@/components/home/ExperiencePreview";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <HomeHeader />

      {/* ------------------------------------------------------------------ */}
      {/* HERO */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden pt-16">
        {/* Subtle background geometry — calm, not decorative noise */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(60% 50% at 70% 20%, hsl(var(--primary) / 0.08), transparent 70%), radial-gradient(40% 40% at 15% 80%, hsl(var(--gold) / 0.06), transparent 70%)",
          }}
        />

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:px-8 lg:pb-32 lg:pt-28">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <Reveal as="div">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                প্রতিটি হাজির উমরাহর সঙ্গী
              </span>
            </Reveal>

            <Reveal
              as="h1"
              delay={60}
              className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              উমরাহ করুন নিশ্চিন্তে,
              <br />
              <span className="text-primary">প্রতিটি ধাপে থাকুক সঠিক নির্দেশনা।</span>
            </Reveal>

            <Reveal
              as="p"
              delay={120}
              className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0"
            >
              উমরাহর শুরু থেকে শেষ পর্যন্ত কোন সময় কী করতে হবে, কোথায় যেতে হবে এবং কোন আমল কীভাবে
              সম্পন্ন করতে হবে—সবকিছু সহজ ও পরিষ্কারভাবে দেখুন TawafMap-এ। ধাপে ধাপে নির্দেশনা ও
              মানচিত্রের সাহায্যে পুরো উমরাহ যাত্রা অনুসরণ করুন, যাতে পথের চিন্তা কমিয়ে ইবাদতে
              মনোযোগ দিতে পারেন।
            </Reveal>

            <Reveal
              as="div"
              delay={180}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start lg:justify-start"
            >
              <Link href="/map" className="w-full sm:w-auto">
                <Button size="lg" className="w-full gap-2 rounded-full px-7 sm:w-auto">
                  <MapPin className="h-4 w-4" />
                  উমরাহ শুরু করুন
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full gap-2 rounded-full px-6 sm:w-auto"
                >
                  <BookOpen className="h-4 w-4" />
                  উমরাহ সম্পর্কে জানুন
                </Button>
              </a>
            </Reveal>

            <Reveal as="p" delay={240} className="mt-5 text-xs text-muted-foreground">
              ইহরাম · তওয়াফ · সাঈ · হালক/তাহাল্লুল — পুরো উমরাহ যাত্রা একসাথে
            </Reveal>
          </div>

          {/* Hero map */}
          <Reveal delay={120} className="relative">
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <TawafMapPreview interactive />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* INTRODUCTION */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-24 lg:px-8">
        <Reveal>
          <p className="text-sm font-semibold text-primary">উমরাহ</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            একটি পবিত্র যাত্রা, ধাপে ধাপে
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            উমরাহ হলো ইহরাম পরিধান থেকে শুরু করে তওয়াফ, সাঈ ও হালক/তাহাল্লুল পর্যন্ত একটি সম্পূর্ণ
            ইবাদত। TawafMap আপনাকে প্রতিটি আমল—কখন কী করতে হবে, কোথায় যেতে হবে এবং কীভাবে সম্পন্ন
            করতে হবে—সহজে অনুসরণ করতে সাহায্য করবে।
          </p>
          <a
            href="#map"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            উমরাহর পথ দেখুন
            <ArrowRight className="h-4 w-4" />
          </a>
        </Reveal>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* HOW IT WORKS */}
      {/* ------------------------------------------------------------------ */}
      <HowItWorks />

      {/* ------------------------------------------------------------------ */}
      {/* SEVEN ROUNDS */}
      {/* ------------------------------------------------------------------ */}
      <TawafRounds />

      {/* ------------------------------------------------------------------ */}
      {/* INTERACTIVE MAP + LANDMARKS */}
      {/* ------------------------------------------------------------------ */}
      <LandmarkExplorer />

      {/* ------------------------------------------------------------------ */}
      {/* EXPERIENCE PREVIEW */}
      {/* ------------------------------------------------------------------ */}
      <ExperiencePreview />

      {/* ------------------------------------------------------------------ */}
      {/* FINAL CTA */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-14 text-center shadow-sm sm:px-12 sm:py-20">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                backgroundImage:
                  "radial-gradient(50% 60% at 50% 0%, hsl(var(--primary) / 0.08), transparent 70%)",
              }}
            />
            <h2 className="mx-auto max-w-xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              উমরাহ শুরু করতে প্রস্তুত?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              ধাপে ধাপে নির্দেশনা অনুসরণ করুন, প্রতিটি ধাপে কী করতে হবে তা জেনে নিন এবং পুরো উমরাহর
              পথে সহজেই দিকনির্দেশনা পেতে থাকুন।
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/map">
                <Button size="lg" className="gap-2 rounded-full px-7">
                  উমরাহ শুরু করুন
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
