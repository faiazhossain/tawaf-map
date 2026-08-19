"use client";

import type { CSSProperties } from "react";
import { Star, ChevronsUpDown } from "lucide-react";
import { NEARBY_CATEGORY_META } from "@/lib/nearby/categories";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import { cn } from "@/lib/utils";
import type { NearbyCategory, NearbyItem } from "@/types/nearby";

interface NearbyCardsStripProps {
  category: NearbyCategory;
  items: NearbyItem[];
  /** inline bottom override — চিপ-বারের ওপরে স্ট্যাক */
  style?: CSSProperties;
  hidden?: boolean;
  onSelect: (item: NearbyItem) => void;
  onExpand: () => void;
}

/**
 * সক্রিয় বিভাগের ৩টি নিকটতম আইটেমের অনুভূমিক সোয়াইপ-কার্ড — চলাচলে লাইভ
 * পুনঃসাজানো হয় (stable keys)। শেষে "সম্প্রসারিত করুন" বোতাম।
 */
export function NearbyCardsStrip({
  category,
  items,
  style,
  hidden = false,
  onSelect,
  onExpand,
}: NearbyCardsStripProps) {
  const meta = NEARBY_CATEGORY_META[category];
  const cards = items.slice(0, 3);
  const Icon = meta.icon;

  if (hidden || cards.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-[40] px-3 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:px-0"
      style={style}
      aria-label={`কাছাকাছি ${meta.plural}`}
    >
      <div className="hide-scrollbar pointer-events-auto flex snap-x snap-mandatory items-stretch gap-2 overflow-x-auto">
        {cards.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            data-testid={`nearby-card-${item.id}`}
            aria-label={`${item.name}, ${item.distanceFormatted}, ${item.walkingTimeFormatted}`}
            className="w-[68vw] max-w-xs shrink-0 snap-start rounded-2xl border border-border/60 bg-surface/95 p-3 text-left shadow-lg backdrop-blur-xl transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:w-72"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-4 w-4 text-primary" aria-hidden />
              </span>
              {typeof item.rating === "number" && (
                <span className="flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold">
                  <Star className="h-3 w-3 fill-gold" aria-hidden />
                  {toBengaliNumber(item.rating)}
                </span>
              )}
            </div>
            <div className="mt-2 truncate text-sm font-semibold text-foreground">{item.name}</div>
            {item.subtitle && (
              <div className="truncate text-xs text-muted-foreground">{item.subtitle}</div>
            )}
            <div className="mt-1 text-xs font-medium text-primary">
              {item.distanceFormatted} • {item.walkingTimeFormatted}
            </div>
          </button>
        ))}

        <button
          type="button"
          onClick={onExpand}
          data-testid="nearby-expand-button"
          aria-label={`${meta.plural} তালিকা সম্প্রসারিত করুন`}
          className="flex w-16 shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-2xl border border-border/60 bg-surface/95 text-muted-foreground shadow-lg backdrop-blur-xl transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronsUpDown className="h-5 w-5" aria-hidden />
          <span className="text-[10px] font-medium leading-tight">
            সব ({toBengaliNumber(items.length)})
          </span>
        </button>
      </div>
    </div>
  );
}
