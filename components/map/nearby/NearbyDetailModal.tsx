"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { NEARBY_CATEGORY_META } from "@/lib/nearby/categories";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { NearbyDetailFullContent } from "./nearby-detail-content";
import type { NearbyItem } from "@/types/nearby";

interface NearbyDetailModalProps {
  item: NearbyItem | null;
  onClose: () => void;
}

/**
 * পূর্ণ তথ্যের মোডাল — স্বচ্ছ-ঝাপসা ব্যাকড্রপ (bg-black/60 backdrop-blur-sm),
 * MistakeAssistant/IncompleteStepDialog-এর মতো একই শেল: role=dialog,
 * aria-modal, focus trap, Escape, body scroll lock। মোবাইলে নিচ থেকে,
 * ডেস্কটপে কেন্দ্রে।
 */
export function NearbyDetailModal({ item, onClose }: NearbyDetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const open = item !== null;
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!item) return null;

  const meta = NEARBY_CATEGORY_META[item.category];
  const Icon = meta.icon;
  const titleId = "nearby-detail-modal-title";

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="nearby-detail-modal"
        className="flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-border/60 bg-surface shadow-2xl sm:max-w-md sm:rounded-2xl"
      >
        {/* হেডার */}
        <div className="flex items-start justify-between gap-3 border-b border-border/60 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-5 w-5 text-primary" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="truncate text-base font-semibold text-foreground">
                {item.name}
              </h2>
              <p className="text-xs text-muted-foreground">{meta.label}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* বডি */}
        <div className="overflow-y-auto px-4 py-4">
          <NearbyDetailFullContent item={item} />
        </div>
      </div>
    </div>
  );
}
