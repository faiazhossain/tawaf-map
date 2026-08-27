"use client";

import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Compass, MapPinned, RotateCcw } from "lucide-react";

export interface LocationRecoverySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission: "granted" | "denied" | "prompt" | "unknown";
  /** Store's last failure message (already the localized taxonomy text). */
  error: string | null;
  loading: boolean;
  onRetry: () => void;
}

/**
 * লোকেশন রিকভারি শীট (UX-001)।
 *
 * আগে অনুমতি না দিলে "আমার কাছে" চিপ-বারটি পুরোপুরি গায়েব হয়ে যেত — কেন,
 * আর এখন কী করতে হবে কোনো ব্যাখ্যা ছিল না। এই শীট সেই মৃত-প্রান্তটি বন্ধ করে:
 * কী হয়েছে (store-এর বাংলা ট্যাক্সোনমি বার্তা), কীভাবে ঠিক করবেন (denied হলে
 * ব্রাউজার-সেটিংস ধাপ), আর অনুমতি ছাড়াও কী কী কাজ করবে সেটি বলে ব্রাউজ-মোডে
 * যাওয়ার পথ দেয়। অটো-খোলা সেশনে একবারই (app/map/page.tsx), পরে শুধু নিজে
 * খুললে দেখা যায়।
 */

const DENIED_STEPS_HINT =
  "ঠিকানা-বারের বাঁ দিকের লক/তীর আইকনে ট্যাপ করুন → Permissions → Location → Allow, তারপর নিচে আবার চেষ্টা করুন।";

export function LocationRecoverySheet({
  open,
  onOpenChange,
  permission,
  error,
  loading,
  onRetry,
}: LocationRecoverySheetProps) {
  const denied = permission === "denied";
  const headline = denied ? "লোকেশনের অনুমতি নেই" : "লোকেশন পাওয়া যায়নি";

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} snapPoints={[0.45]}>
      <div className="px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] pt-1">
        <div className="flex items-center gap-2.5">
          {denied ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20">
              <Compass className="h-5 w-5 text-rose-400" aria-hidden />
            </span>
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
              <MapPinned className="h-5 w-5 text-primary" aria-hidden />
            </span>
          )}
          <h2 className="text-base font-semibold text-foreground">{headline}</h2>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          আপনার কাছের হোটেল, গেট আর খাবারের দোকান দেখাতে ব্রাউজারের লোকেশন অনুমতি লাগে।
        </p>

        {error && (
          <p
            role="note"
            data-testid="location-recovery-store-error"
            className="mt-2 text-xs leading-relaxed text-muted-foreground"
          >
            {error}
          </p>
        )}

        {denied && (
          <div className="mt-3 rounded-xl border border-border/60 bg-muted/50 px-3.5 py-3">
            <p className="text-xs leading-relaxed text-foreground">{DENIED_STEPS_HINT}</p>
          </div>
        )}

        {/* অনুমতি ছাড়াও পণ্যের বাকি অংশ অক্ষত — মৃত-প্রান্ত নয় */}
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          অনুমতি ছাড়াও গেট সার্চ, ওমরাহ গাইড আর মিকাত ম্যাপ কাজ করবে — চাইলে এখনই ঘুরে দেখুন।
        </p>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="gap-2 border-border bg-surface/60 hover:bg-muted text-foreground hover:text-foreground"
          >
            <MapPinned className="h-4 w-4" aria-hidden />
            মানচিত্র ব্রাউজ করুন
          </Button>
          <Button
            onClick={onRetry}
            disabled={loading}
            data-testid="location-recovery-retry"
            className="gap-2 bg-primary hover:bg-primary-hover text-primary-foreground border-0"
          >
            {loading ? (
              <span
                aria-hidden
                className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
              />
            ) : (
              <RotateCcw className="h-4 w-4" aria-hidden />
            )}
            {loading ? "চেষ্টা চলছে…" : "আবার চেষ্টা করুন"}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
