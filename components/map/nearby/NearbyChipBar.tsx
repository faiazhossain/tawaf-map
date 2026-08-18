"use client";

import type { CSSProperties } from "react";
import { Settings2 } from "lucide-react";
import { NEARBY_CATEGORIES } from "@/lib/nearby/categories";
import { useNearbyStore } from "@/lib/store/nearbyStore";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import { cn } from "@/lib/utils";
import type { NearbyCategory, NearbyCounts } from "@/types/nearby";

interface NearbyChipBarProps {
  counts: NearbyCounts;
  activeCategory: NearbyCategory | null;
  /** সত্য হলে রেন্ডারই হয় না (গাইড ফুল-স্ন্যাপ / প্যানেল খোলা / লোকেশন নেই) */
  hidden?: boolean;
  /** inline bottom override — গাইড শিটের স্ন্যাপ অনুসারে (LandmarkHint প্যাটার্ন) */
  style?: CSSProperties;
  onSelectCategory: (category: NearbyCategory) => void;
  onOpenSettings: () => void;
}

/**
 * "আমার কাছে" চিপ-বার — নিচের প্রান্তে অনুভূমিক স্ক্রলযোগ্য বিভাগ-চিপ
 * (আইকন + বাংলা সংখ্যায় গণনা), শুরুতে সেটিংস বোতাম।
 * চিপ ট্যাপ = বিভাগ সক্রিয়/নিষ্ক্রিয়; সক্রিয় চিপ = emerald।
 */
export function NearbyChipBar({
  counts,
  activeCategory,
  hidden = false,
  style,
  onSelectCategory,
  onOpenSettings,
}: NearbyChipBarProps) {
  const enabledCategories = useNearbyStore((state) => state.enabledCategories);
  const chips = NEARBY_CATEGORIES.filter((meta) => enabledCategories.includes(meta.id));

  if (hidden) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-4 z-[40] px-3 md:inset-x-auto md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:px-0"
      style={style}
      role="group"
      aria-label="আমার কাছে বিভাগ"
    >
      <div className="hide-scrollbar pointer-events-auto flex items-center gap-2 overflow-x-auto pb-[env(safe-area-inset-bottom,0)] py-1">
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="কাছাকাছি সেটিংস"
          data-testid="nearby-settings-button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface/95 text-muted-foreground shadow-lg backdrop-blur-xl transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Settings2 className="h-5 w-5" aria-hidden />
        </button>

        {chips.map((meta) => {
          const count = counts[meta.id];
          const isActive = activeCategory === meta.id;
          const Icon = meta.icon;
          const disabled = count === 0 && !isActive;
          return (
            <button
              key={meta.id}
              type="button"
              disabled={disabled}
              aria-pressed={isActive}
              data-testid={`nearby-chip-${meta.id}`}
              onClick={() => onSelectCategory(meta.id)}
              className={cn(
                "flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium shadow-lg backdrop-blur-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface/95 text-foreground hover:bg-muted",
                disabled && "opacity-40"
              )}
            >
              <Icon
                className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-primary")}
                aria-hidden
              />
              <span className="whitespace-nowrap">
                {toBengaliNumber(count)} {meta.plural}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
