"use client";

import { Minus, Plus, type LucideIcon } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { NEARBY_CATEGORIES } from "@/lib/nearby/categories";
import {
  useNearbyStore,
  NEARBY_RADIUS_MAX,
  NEARBY_RADIUS_MIN,
  NEARBY_RADIUS_STEP,
  NEARBY_RADIUS_PRESETS,
} from "@/lib/store/nearbyStore";
import { formatDistance } from "@/lib/utils/distance";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import { cn } from "@/lib/utils";

interface NearbySettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** সুইচ-সারি: বামে আইকন+লেবেল, ডানে টগল (পেজের MenuToggleRow ধাঁচ) */
function ToggleRow({
  label,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string;
  icon: LucideIcon;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onChange}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-muted"
    >
      <span className="flex items-center gap-2.5">
        <Icon
          className={cn("h-[18px] w-[18px]", checked ? "text-primary" : "text-muted-foreground")}
          aria-hidden
        />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "flex h-5 w-9 shrink-0 items-center rounded-full border px-[2px] transition-colors",
          checked ? "justify-end border-primary bg-primary" : "justify-start border-border bg-muted"
        )}
      >
        <span className="block h-4 w-4 rounded-full bg-white shadow" />
      </span>
    </button>
  );
}

/** ভাগ করা কনটেন্ট — মোবাইল শিট ও ডেস্কটপ কার্ড উভয়েই ব্যবহৃত */
function SettingsContent() {
  const radius = useNearbyStore((state) => state.radius);
  const stepRadius = useNearbyStore((state) => state.stepRadius);
  const setRadius = useNearbyStore((state) => state.setRadius);
  const enabledCategories = useNearbyStore((state) => state.enabledCategories);
  const toggleEnabledCategory = useNearbyStore((state) => state.toggleEnabledCategory);
  const halalOnly = useNearbyStore((state) => state.halalOnly);
  const setHalalOnly = useNearbyStore((state) => state.setHalalOnly);

  return (
    <div className="space-y-5 px-1">
      {/* ব্যাসার্ধ */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">ব্যাসার্ধ</h4>
          <span className="text-sm font-medium text-primary">{formatDistance(radius)}</span>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="রেডিয়াস নিয়ন্ত্রণ">
          <button
            type="button"
            onClick={() => stepRadius(-NEARBY_RADIUS_STEP)}
            disabled={radius <= NEARBY_RADIUS_MIN}
            aria-label={`ব্যাসার্ধ ${toBengaliNumber(NEARBY_RADIUS_STEP)} মিটার কমান`}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-muted disabled:opacity-40"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <div className="flex-1 rounded-xl bg-muted/60 py-2 text-center text-sm font-medium text-foreground">
            আপনার অবস্থান থেকে {formatDistance(radius)}
          </div>
          <button
            type="button"
            onClick={() => stepRadius(NEARBY_RADIUS_STEP)}
            disabled={radius >= NEARBY_RADIUS_MAX}
            aria-label={`ব্যাসার্ধ ${toBengaliNumber(NEARBY_RADIUS_STEP)} মিটার বাড়ান`}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-muted disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {NEARBY_RADIUS_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setRadius(preset)}
              aria-pressed={radius === preset}
              className={cn(
                "h-9 rounded-full border px-3.5 text-sm transition-colors",
                radius === preset
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {formatDistance(preset)}
            </button>
          ))}
        </div>
      </section>

      {/* বিভাগ */}
      <section>
        <h4 className="mb-1 text-sm font-semibold text-foreground">বিভাগ</h4>
        <div className="divide-y divide-border">
          {NEARBY_CATEGORIES.map((meta) => {
            const Icon = meta.icon;
            return (
              <ToggleRow
                key={meta.id}
                label={meta.label}
                icon={Icon}
                checked={enabledCategories.includes(meta.id)}
                onChange={() => toggleEnabledCategory(meta.id)}
              />
            );
          })}
        </div>
      </section>

      {/* খাবার ফিল্টার */}
      <section>
        <h4 className="mb-1 text-sm font-semibold text-foreground">খাবার</h4>
        <div className="divide-y divide-border">
          <ToggleRow
            label="শুধু হালাল খাবার"
            icon={NEARBY_CATEGORIES.find((c) => c.id === "restaurant")!.icon}
            checked={halalOnly}
            onChange={() => setHalalOnly(!halalOnly)}
          />
        </div>
      </section>
    </div>
  );
}

/**
 * কাছাকাছি সেটিংস — মোবাইলে (<768px) ছোট বটম শিট, ডেস্কটপে বার-এর উপরে
 * ভাসমান কার্ড। একবারে একটিই শেল মাউন্ট হয় (useMediaQuery শর্ত)।
 */
export function NearbySettingsPanel({ open, onOpenChange }: NearbySettingsPanelProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!open) return null;

  if (isDesktop) {
    return (
      <div className="absolute bottom-28 left-1/2 z-[100] w-96 -translate-x-1/2 rounded-2xl border border-border/60 bg-surface/95 p-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">কাছাকাছি সেটিংস</h3>
          <span className="text-xs text-muted-foreground">ব্যাসার্ধ ও বিভাগ বেছে নিন</span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <SettingsContent />
        </div>
      </div>
    );
  }

  return (
    <div className="md:hidden">
      <BottomSheet
        open={open}
        onOpenChange={onOpenChange}
        snapPoints={[0.5]}
        defaultSnap={0}
        showBackdrop
        dismissOnBackdropClick
        dismissOnDragDown
      >
        <BottomSheet.Header>
          <BottomSheet.Title>কাছাকাছি সেটিংস</BottomSheet.Title>
          <BottomSheet.Subtitle>ব্যাসার্ধ ও বিভাগ বেছে নিন</BottomSheet.Subtitle>
        </BottomSheet.Header>
        <BottomSheet.ScrollContent>
          <SettingsContent />
        </BottomSheet.ScrollContent>
      </BottomSheet>
    </div>
  );
}
