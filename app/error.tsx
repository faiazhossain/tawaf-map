"use client";

// Route-level error boundary (FE-001): without this, any uncaught client
// exception replaced the whole product with Next's English default screen.
// Guide progress, theme and settings live in persisted stores, so a reset
// never costs the pilgrim their data — the copy says so explicitly.

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The boundary is the UX; the console keeps something for Sentry (OBS-001).
    console.error("[app-error]", error);
  }, [error]);

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-3 px-6 text-center bg-background">
      <p className="text-lg font-semibold text-foreground">কিছু একটা ঠিক হচ্ছে না</p>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        অ্যাপ লোড করতে সমস্যা হচ্ছে। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন — আপনার গাইডের অগ্রগতি ও
        সেটিংস সংরক্ষিত থাকবে।
      </p>
      <div className="mt-2 flex items-center gap-4">
        <Button
          onClick={reset}
          className="bg-primary hover:bg-primary-hover text-primary-foreground border-0"
        >
          আবার চেষ্টা করুন
        </Button>
        <Link href="/map" className="text-sm text-primary underline-offset-4 hover:underline">
          মানচিত্রে ফিরে যান
        </Link>
      </div>
    </main>
  );
}
