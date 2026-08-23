"use client";

import { Star, Maximize2, TrendingDown, TrendingUp, Footprints, X } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { NEARBY_CATEGORY_META } from "@/lib/nearby/categories";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useLiveNearbyItem } from "@/lib/hooks/useLiveNearbyItem";
import { cn } from "@/lib/utils";
import type { NearbyItem } from "@/types/nearby";

interface NearbyDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: NearbyItem;
  onShowDetails: () => void;
}

/** ডিটেইল সারাংশ — শিট (৩০%) ও ডেস্কটপ কার্ড উভয়ে */
function DetailContent({
  item,
  onShowDetails,
  headerAction,
}: {
  item: NearbyItem;
  onShowDetails: () => void;
  /** ডেস্কটপ কার্ডের কাছ-বাটন ইত্যাদি — শিরোনাম-সারির ডানে বসে */
  headerAction?: React.ReactNode;
}) {
  const meta = NEARBY_CATEGORY_META[item.category];
  const Icon = meta.icon;
  // লাইভ দূরত্ব — স্ন্যাপশট নয়; চলাচলে প্রতি ~২ মিটারে বদলায় (ব্যাসার্ধ-নিরপেক্ষ)
  const live = useLiveNearbyItem(item);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-5 w-5 text-primary" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-foreground">{item.name}</h3>
            {typeof item.rating === "number" && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold">
                <Star className="h-3 w-3 fill-gold" aria-hidden />
                {toBengaliNumber(item.rating)}
              </span>
            )}
          </div>
          {item.nameAr && (
            <p dir="rtl" className="truncate font-arabic text-sm text-muted-foreground">
              {item.nameAr}
            </p>
          )}
          <p className="truncate text-xs text-muted-foreground">
            {item.subtitle ? `${meta.label} • ${item.subtitle} • ` : `${meta.label} • `}
            {live.direction} দিকে
          </p>
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>

      {/* লাইভ দূরত্ব-সারি — স্ক্রিন-রিডার এক বাক্যে শোনে (polite, atomic) */}
      <div
        className="flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2"
        aria-live="polite"
        aria-atomic="true"
      >
        <span
          className="shrink-0 text-sm font-semibold text-primary"
          data-testid="nearby-detail-distance"
        >
          {live.distanceFormatted}
        </span>
        {live.isNear ? (
          <span
            className="flex min-w-0 items-center gap-1 text-xs font-semibold text-success"
            data-testid="nearby-near-state"
          >
            <Footprints className="h-3.5 w-3.5 shrink-0" aria-hidden />
            প্রায় পৌঁছে গেছেন
          </span>
        ) : (
          live.trend && (
            <span
              className={cn(
                "flex min-w-0 items-center gap-1 text-xs font-medium",
                live.trend === "closer" ? "text-success" : "text-muted-foreground"
              )}
              data-testid="nearby-detail-trend"
            >
              {live.trend === "closer" ? (
                <TrendingDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
              ) : (
                <TrendingUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
              )}
              {live.trend === "closer" ? "কাছে আসছেন" : "দূরে যাচ্ছেন"}
            </span>
          )
        )}
        <span className="shrink-0 text-sm text-foreground" data-testid="nearby-detail-walk-time">
          {live.walkingTimeFormatted} হেঁটে
        </span>
      </div>

      <Button
        onClick={onShowDetails}
        data-testid="nearby-show-details-button"
        className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary-hover"
      >
        <Maximize2 className="mr-1.5 h-4 w-4" aria-hidden />
        বিস্তারিত
      </Button>
    </div>
  );
}

/**
 * নির্বাচিত আইটেমের ডিটেইল শিট — মোবাইলে ~৩০% ভিউপোর্ট (স্ন্যাপ ০.৩, টেনে
 * ওপরে ৮৫% পর্যন্ত), ডেস্কটপে ডান-পাশের কার্ড। "বিস্তারিত" মোডাল খোলে।
 */
export function NearbyDetailSheet({
  open,
  onOpenChange,
  item,
  onShowDetails,
}: NearbyDetailSheetProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!open) return null;

  if (isDesktop) {
    return (
      <div className="absolute bottom-24 right-4 z-[100] w-96 rounded-2xl border border-border/60 bg-surface/95 p-4 shadow-2xl backdrop-blur-xl">
        <DetailContent
          item={item}
          onShowDetails={onShowDetails}
          headerAction={
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="বন্ধ করুন"
              data-testid="nearby-detail-close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          }
        />
      </div>
    );
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[0.3, 0.85]}
      defaultSnap={0}
      showBackdrop={false}
      dismissOnDragDown
    >
      <BottomSheet.Header>
        <div className="flex-1" />
        <BottomSheet.CloseButton />
      </BottomSheet.Header>
      <BottomSheet.Content>
        <DetailContent item={item} onShowDetails={onShowDetails} />
      </BottomSheet.Content>
    </BottomSheet>
  );
}
