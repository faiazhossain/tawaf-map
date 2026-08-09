"use client";

import { X, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface LandmarkHintProps {
  title: string;
  description: string;
  anchorName?: string;
  actionLabel?: string;
  onDismiss: () => void;
  className?: string;
}

export function LandmarkHint({
  title,
  description,
  anchorName,
  actionLabel,
  onDismiss,
  className,
}: LandmarkHintProps) {
  return (
    <div
      className={cn(
        "max-w-sm rounded-3xl border border-border/80 bg-surface/95 p-4 shadow-2xl backdrop-blur-xl text-left",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {anchorName ? <p className="text-xs text-muted-foreground">{anchorName}</p> : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="এই টিপটি লুকান"
          className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-foreground">{description}</p>

      {actionLabel ? (
        <div className="mt-3">
          <span className="inline-flex rounded-full bg-muted/70 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-foreground">
            {actionLabel}
          </span>
        </div>
      ) : null}
    </div>
  );
}
