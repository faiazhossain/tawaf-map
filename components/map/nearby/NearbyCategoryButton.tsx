"use client";

import { NEARBY_CATEGORY_META } from "@/lib/nearby/categories";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import { cn } from "@/lib/utils";
import type { NearbyCategory } from "@/types/nearby";

interface NearbyCategoryButtonProps {
  category: NearbyCategory;
  count: number;
  active: boolean;
  /** বাইরের অতিরিক্ত নিষেধ (যেমন লোকেশন ফিক্স নেই) — ভেতরের শূন্য-গণনা নিয়মের সাথে OR */
  disabled?: boolean;
  /** লেআউট-নির্ভর ক্লাস (মোবাইল মেনুর সারি ইত্যাদি) */
  className?: string;
  /** চিপ-বার প্রভাবের সাথে সামঞ্জস্যের জন্য ওভাররাইড */
  testId?: string;
  onSelect: (category: NearbyCategory) => void;
}

/**
 * বিভাগ-চিপের একক দৃশ্য — NearbyChipBar এবং উপরের নেভবার/মোবাইল মেনুর
 * বোতাম একই কম্পোনেন্ট ব্যবহার করে, তাই "আমার কাছে" অভিজ্ঞতা সব প্রবেশপথে
 * হুবহু একই দেখায় ও একইভাবে আচরণ করে।
 * ট্যাপ = বিভাগ সক্রিয়/নিষ্ক্রিয় (nearbyStore.setActiveCategory সিম্যান্টিক্স);
 * সক্রিয় = emerald। শূন্য গণনা ও নিষ্ক্রিয় বিভাগ ট্যাপযোগ্য নয়, তবে সক্রিয়
 * বিভাগ শূন্য হলেও টগল-অফ করা যায়।
 */
export function NearbyCategoryButton({
  category,
  count,
  active,
  disabled = false,
  className,
  testId,
  onSelect,
}: NearbyCategoryButtonProps) {
  const meta = NEARBY_CATEGORY_META[category];
  const Icon = meta.icon;
  const inactive = disabled || (count === 0 && !active);

  return (
    <button
      type="button"
      disabled={inactive}
      aria-pressed={active}
      data-testid={testId ?? `nearby-category-button-${category}`}
      onClick={() => onSelect(category)}
      className={cn(
        "flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium shadow-lg backdrop-blur-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface/95 text-foreground hover:bg-muted",
        inactive && "opacity-40",
        className
      )}
    >
      <Icon
        className={cn("h-4 w-4", active ? "text-primary-foreground" : "text-primary")}
        aria-hidden
      />
      <span className="whitespace-nowrap">
        {toBengaliNumber(count)} {meta.plural}
      </span>
    </button>
  );
}
