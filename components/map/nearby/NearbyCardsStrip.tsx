"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { Star, ChevronsUpDown } from "lucide-react";
import { NEARBY_CATEGORY_META } from "@/lib/nearby/categories";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import { useLiveNearbyItem } from "@/lib/hooks/useLiveNearbyItem";
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

/** ব্যবহারকারীর স্ক্রল-ইন্টারঅ্যাকশনের পর এতক্ষণ "স্ক্রলিং-এ নয়" ধরা হয় */
const SNAP_IDLE_MS = 2500;
/** এর কম scrollLeft-কে "প্রথম কার্ডেই আছি" ধরা হয় — স্ন্যাপের দরকার নেই */
const SNAP_MIN_SCROLL_LEFT = 8;

/**
 * একটি কার্ড — দূরত্ব/সময় লাইভ (প্রতি ~২ মি চলাচলে), কার্ডের সদস্যতা/ক্রম
 * নয়: তালিকার কাঠামো ১০ মি হিস্টেরেসিসে থাকে (useNearbyPlaces)। ফলে
 * কার্ডের লেখা কয়েক মি তাজা হতে পারে ক্রমের চেয়ে — পরের ১০ মি সীমানায়
 * সাজানো ধরে নিলে মিলে যায়।
 */
function NearbyCard({
  item,
  isNearest,
  onSelect,
}: {
  item: NearbyItem;
  isNearest: boolean;
  onSelect: (item: NearbyItem) => void;
}) {
  const meta = NEARBY_CATEGORY_META[item.category];
  const Icon = meta.icon;
  const live = useLiveNearbyItem(item);

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      data-testid={`nearby-card-${item.id}`}
      aria-label={`${item.name}, ${live.distanceFormatted}, ${live.walkingTimeFormatted}`}
      className="w-[68vw] max-w-xs shrink-0 snap-start rounded-2xl border border-border/60 bg-surface/95 p-3 text-left shadow-lg backdrop-blur-xl transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:w-72"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-4 w-4 text-primary" aria-hidden />
        </span>
        <span className="flex items-center gap-1.5">
          {isNearest && (
            <span
              data-testid="nearby-nearest-badge"
              className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
            >
              নিকটতম
            </span>
          )}
          {typeof item.rating === "number" && (
            <span className="flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold">
              <Star className="h-3 w-3 fill-gold" aria-hidden />
              {toBengaliNumber(item.rating)}
            </span>
          )}
        </span>
      </div>
      <div className="mt-2 truncate text-sm font-semibold text-foreground">{item.name}</div>
      {item.subtitle && (
        <div className="truncate text-xs text-muted-foreground">{item.subtitle}</div>
      )}
      <div
        className="mt-1 text-xs font-medium text-primary"
        data-testid={`nearby-card-distance-${item.id}`}
      >
        {live.distanceFormatted} • {live.walkingTimeFormatted}
      </div>
    </button>
  );
}

/**
 * সক্রিয় বিভাগের ৩টি নিকটতম আইটেমের অনুভূমিক সোয়াইপ-কার্ড। শেষে
 * "সম্প্রসারিত করুন" বোতাম।
 *
 * চলাচলে দুই স্তরে বদলায়: প্রতি ফিক্সে কার্ডের দূরত্ব-লেখা লাইভ
 * (useLiveNearbyItem), আর ~১০ মি পার হলে তালিকা পুনঃসাজানো হয় — নতুন
 * নিকটতম এলে স্ট্রিপ ব্যবহারকারী নিজে স্ক্রল করছে না থাকলে মসৃণভাবে
 * প্রথম কার্ডে ফিরে আসে (auto-snap)।
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

  const scrollRef = useRef<HTMLDivElement>(null);
  // শেষ ইন্টারঅ্যাকশনের টাইমস্ট্যাম্প (পয়েন্টার/টাচ/হুইল/কী) — auto-snap
  // কেবল নিস্ক্রিয় অবস্থায় চলে, ব্যবহারকারীর স্ক্রল-অবস্থান প্রাধান্য পায়।
  const lastInteractionTsRef = useRef(0);
  const prevTopKeyRef = useRef<string | null>(null);

  const topKey = cards.map((item) => item.id).join("|");

  useEffect(() => {
    const prev = prevTopKeyRef.current;
    prevTopKeyRef.current = topKey;
    // প্রথম মাউন্ট বা অপরিবর্তিত ক্রমে কিছু করার নেই
    if (prev === null || prev === topKey) return;
    // সদ্য ইন্টারঅ্যাকশন হলে স্ন্যাপ নয় — ব্যবহারকারীর ইচ্ছাই থাকুক
    if (Date.now() - lastInteractionTsRef.current < SNAP_IDLE_MS) return;

    const el = scrollRef.current;
    if (!el || el.scrollLeft <= SNAP_MIN_SCROLL_LEFT) return;
    // jsdom-এ Element.scrollTo নেই — গার্ড ছাড়া পরীক্ষা ভেঙে যেত
    if (typeof el.scrollTo !== "function") return;
    el.scrollTo({ left: 0, behavior: "smooth" });
  }, [topKey]);

  if (hidden || cards.length === 0) return null;

  // স্ক্রল-ইন্টারঅ্যাকশনের স্ট্যাম্প — সব হ্যান্ডলারে একই কাজ
  const stampInteraction = () => {
    lastInteractionTsRef.current = Date.now();
  };

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-[40] px-3 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:px-0"
      style={style}
      aria-label={`কাছাকাছি ${meta.plural}`}
    >
      <div
        ref={scrollRef}
        onPointerDown={stampInteraction}
        onPointerUp={stampInteraction}
        onPointerCancel={stampInteraction}
        onTouchStart={stampInteraction}
        onTouchEnd={stampInteraction}
        onWheel={stampInteraction}
        onKeyDown={stampInteraction}
        className="hide-scrollbar pointer-events-auto flex snap-x snap-mandatory items-stretch gap-2 overflow-x-auto"
      >
        {cards.map((item, index) => (
          <NearbyCard key={item.id} item={item} isNearest={index === 0} onSelect={onSelect} />
        ))}

        <button
          type="button"
          onClick={onExpand}
          data-testid="nearby-expand-button"
          aria-label={`${meta.plural} তালিকা সম্প্রসারিত করুন`}
          className={cn(
            "flex w-16 shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-2xl",
            "border border-border/60 bg-surface/95 text-muted-foreground shadow-lg backdrop-blur-xl",
            "transition-colors hover:border-primary/40 hover:text-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
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
