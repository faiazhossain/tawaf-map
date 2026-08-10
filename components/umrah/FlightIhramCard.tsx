"use client";

import { useState } from "react";
import { PlaneTakeoff, Check, ChevronDown, AlertTriangle, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUmrahGuideStore } from "@/lib/store/umrahGuideStore";
import { AIR_IHRAM_CHECKLIST, resolveMiqatForTravelPath } from "@/lib/data/umrah/miqat";
import { getDuaById } from "@/lib/data/umrah/duas";

/**
 * বিমানে ইহরাম কার্ড — ঢাকা -> জেদ্দা পথের জন্য (পরিকল্পনা ৫.৪)
 *
 * উড্ডয়ন-পূর্ব চেকলিস্ট, ম্যানুয়াল "কাউন্টডাউন" নির্দেশনা (v1-এ ফ্লাইট ট্র্যাকিং নেই),
 * তালবিয়াহ (বিস্তারিত) এবং জেদ্দা বিমানবন্দরে ইহরামের দম-সতর্কতা দেখায়।
 * শুধুমাত্র air-dhaka-jeddah যাত্রাপথে রেন্ডার হয়; অন্যথা null।
 */
export function FlightIhramCard() {
  const profile = useUmrahGuideStore((s) => s.profile);
  const [checked, setChecked] = useState<boolean[]>(() => AIR_IHRAM_CHECKLIST.map(() => false));
  const [showTalbiyah, setShowTalbiyah] = useState(false);

  // শুধু বিমানপথে প্রাসঙ্গিক
  if (profile?.travelPath !== "air-dhaka-jeddah") return null;

  const mapping = resolveMiqatForTravelPath("air-dhaka-jeddah");
  const talbiyah = getDuaById("talbiyah");
  const doneCount = checked.filter(Boolean).length;

  const toggle = (i: number) => setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
      {/* শিরোনাম */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gradient-to-r from-primary/15 to-primary/5 border-b border-primary/20">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <PlaneTakeoff className="w-4.5 h-4.5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight">
            বিমানে ইহরাম — ঢাকা → জেদ্দা
          </p>
          <p className="text-[11px] text-primary">
            উড্ডয়নের আগেই প্রস্তুতি নিন ({doneCount}/{checked.length})
          </p>
        </div>
      </div>

      <div className="px-3 py-3 space-y-3">
        {/* উড্ডয়ন-পূর্ব চেকলিস্ট */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-foreground">বোর্ডিংয়ের আগে যা করবেন</p>
          {AIR_IHRAM_CHECKLIST.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className={cn(
                "w-full flex items-start gap-2.5 p-2 rounded-lg border text-left transition-all",
                checked[i]
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-muted/40 border-border/40 hover:bg-muted/70"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors",
                  checked[i] ? "bg-emerald-500 border-emerald-500" : "border-border bg-surface"
                )}
              >
                {checked[i] && <Check className="w-3 h-3 text-white" />}
              </span>
              <span
                className={cn(
                  "text-xs leading-relaxed",
                  checked[i] ? "text-muted-foreground line-through" : "text-foreground"
                )}
              >
                {item.bn}
              </span>
            </button>
          ))}
        </div>

        {/* ম্যানুয়াল কাউন্টডাউন নির্দেশনা */}
        <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-xs text-foreground leading-relaxed">
            <span className="font-semibold text-primary">
              মীকাত অতিক্রম করার আগেই ইহরামের পোশাক পরে প্রস্তুত থাকুন।
            </span>{" "}
            বিমানে সাধারণত মীকাতের কাছাকাছি পৌঁছানোর সময় ঘোষণা দেওয়া হয়। তবে শুধু ঘোষণার ওপর
            নির্ভর না করে ফ্লাইটের তথ্যও অনুসরণ করুন। মীকাত অতিক্রম করার আগেই উমরাহর নিয়ত করুন এবং
            তালবিয়া পাঠ শুরু করুন।
          </p>
        </div>

        {/* তালবিয়াহ (বিস্তারিত) */}
        {talbiyah && (
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowTalbiyah((v) => !v)}
              className="w-full flex items-center justify-between gap-2 px-2.5 py-2 bg-muted/50 hover:bg-muted transition-colors"
            >
              <span className="flex min-w-0 items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-xs font-bold leading-tight text-foreground">
                    তালবিয়া
                  </span>
                  <span className="block text-[11px] leading-tight text-primary">
                    ইহরামের সময় পাঠ করার দোয়া
                  </span>
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  showTalbiyah && "rotate-180"
                )}
              />
            </button>
            {showTalbiyah && (
              <div className="px-2.5 py-2.5 space-y-1.5 bg-surface/40">
                <p className="text-base leading-loose text-right text-foreground" dir="rtl">
                  {talbiyah.arabic}
                </p>
                {talbiyah.transliteration && (
                  <p className="text-[11px] italic text-muted-foreground">
                    {talbiyah.transliteration}
                  </p>
                )}
                <p className="text-xs text-foreground leading-relaxed">
                  <span className="text-muted-foreground">অর্থ: </span>
                  {talbiyah.translationBn}
                </p>
              </div>
            )}
          </div>
        )}

        {/* দম-সতর্কতা */}
        {mapping.warning && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-warning/10 border border-warning/30">
            <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-warning leading-relaxed">{mapping.warning.bn}</p>
          </div>
        )}
      </div>
    </div>
  );
}
