"use client";

import { ChevronRight } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { NEARBY_CATEGORY_META } from "@/lib/nearby/categories";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import type { NearbyCategory, NearbyItem } from "@/types/nearby";

interface NearbyListSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: NearbyCategory;
  items: NearbyItem[];
  selectedItemId: string | null;
  onSelect: (item: NearbyItem) => void;
}

/** দূরত্ব-সাজানো সারি — তালিকা শিট ও ডেস্কটপ কার্ড উভয়েই ব্যবহৃত */
function NearbyListContent({
  category,
  items,
  selectedItemId,
  onSelect,
}: Pick<NearbyListSheetProps, "category" | "items" | "selectedItemId" | "onSelect">) {
  const meta = NEARBY_CATEGORY_META[category];
  const Icon = meta.icon;

  return (
    <div role="list" aria-label={`কাছাকাছি ${meta.plural} তালিকা`}>
      {items.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          ব্যাসার্ধের ভেতরে কোনো {meta.label} নেই — সেটিংসে ব্যাসার্ধ বাড়িয়ে দেখুন
        </p>
      )}
      {items.map((item) => {
        const isSelected = item.id === selectedItemId;
        return (
          <button
            key={item.id}
            type="button"
            role="listitem"
            onClick={() => onSelect(item)}
            data-testid={`nearby-row-${item.id}`}
            aria-label={`${item.name}, ${item.distanceFormatted}`}
            className={cn(
              "flex w-full items-center justify-between gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/60",
              isSelected && "bg-primary-soft"
            )}
          >
            <span className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10"
                )}
              >
                <Icon
                  className={cn("h-4 w-4", isSelected ? "text-primary-foreground" : "text-primary")}
                  aria-hidden
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {item.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {item.subtitle ? `${item.subtitle} • ` : ""}
                  {item.direction} দিকে
                </span>
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-sm font-semibold text-primary">
                {item.distanceFormatted}
              </span>
              <span className="block text-xs text-muted-foreground">
                {item.walkingTimeFormatted} হেঁটে
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

/**
 * প্রসারিত তালিকা — মোবাইলে বটম শিট ([০.৫, ০.৮৫]), ডেস্কটপে ডান-পাশের
 * কার্ড (প্যানেল কনভেনশন)। সারি ট্যাপ করলে তালিকা বন্ধ হয়ে ডিটেইল শিট খোলে।
 */
export function NearbyListSheet({
  open,
  onOpenChange,
  category,
  items,
  selectedItemId,
  onSelect,
}: NearbyListSheetProps) {
  const meta = NEARBY_CATEGORY_META[category];
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!open) return null;

  const title = `কাছাকাছি ${meta.plural} (${toBengaliNumber(items.length)})`;

  if (isDesktop) {
    return (
      <div className="absolute right-4 top-4 z-[100] w-96 overflow-hidden rounded-2xl border border-border/60 bg-surface/95 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <span className="text-xs text-muted-foreground">আপনার অবস্থান থেকে</span>
        </div>
        <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto">
          <NearbyListContent
            category={category}
            items={items}
            selectedItemId={selectedItemId}
            onSelect={onSelect}
          />
        </div>
      </div>
    );
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[0.5, 0.85]}
      defaultSnap={0}
      showBackdrop={false}
      dismissOnDragDown
    >
      <BottomSheet.Header>
        <BottomSheet.Title>{title}</BottomSheet.Title>
        <BottomSheet.Subtitle>আপনার অবস্থান থেকে দূরত্ব অনুসারে</BottomSheet.Subtitle>
      </BottomSheet.Header>
      <BottomSheet.ScrollContent>
        <NearbyListContent
          category={category}
          items={items}
          selectedItemId={selectedItemId}
          onSelect={onSelect}
        />
      </BottomSheet.ScrollContent>
    </BottomSheet>
  );
}
