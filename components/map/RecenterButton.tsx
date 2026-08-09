"use client";

import { LocateFixed } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecenterButtonProps {
  onClick: () => void;
  className?: string;
  label?: string;
}

/**
 * "Recenter" বোতাম - ব্যবহারকারী ম্যানুয়ালি মানচিত্র সরালে দেখানো হয়।
 * ট্যাপ করলে বর্তমান গাইড ধাপের ভিউতে ফিরে যায়।
 * ৪৪x৪৪ টাচ টার্গেট, safe-area-সচেতন।
 */
export function RecenterButton({
  onClick,
  className,
  label = "কেন্দ্রে ফেরান",
}: RecenterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex items-center justify-center",
        "h-11 w-11 rounded-full",
        "bg-surface/90 backdrop-blur-xl border border-primary/40",
        "text-primary hover:text-primary hover:bg-muted",
        "shadow-lg active:scale-95 transition",
        className
      )}
    >
      <LocateFixed className="w-5 h-5" />
    </button>
  );
}
