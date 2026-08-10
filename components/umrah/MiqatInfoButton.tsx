"use client";

import { InfoPopover } from "@/components/umrah/InfoPopover";
import { MIQAT_INFO } from "@/lib/data/umrah/miqat";

/**
 * "মীকাত কী?" তথ্য বোতাম — "মীকাত" লেখার পাশে বসানো হয়; হোভার/ট্যাপে
 * মীকাতের ধারণা, সহজ সংজ্ঞা, উদাহরণ ও রেফারেন্স দেখায়।
 */
export function MiqatInfoButton({ className }: { className?: string }) {
  return (
    <InfoPopover label="মীকাত কী?" className={className}>
      <div className="space-y-2">
        <p className="text-xs font-bold text-primary">মীকাত কী?</p>
        <p className="text-[12px] leading-relaxed text-foreground">{MIQAT_INFO.intro}</p>
        <p className="text-[12px] leading-relaxed text-foreground">{MIQAT_INFO.detail}</p>
        <p className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-[12px] font-semibold text-primary">
          {MIQAT_INFO.short}
        </p>
        <p className="text-[12px] leading-relaxed text-foreground">{MIQAT_INFO.example}</p>
        <div className="border-t border-border/50 pt-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            রেফারেন্স
          </p>
          <ul className="space-y-0.5">
            {MIQAT_INFO.references.map((ref) => (
              <li key={ref.label} className="text-[11px] leading-relaxed text-muted-foreground">
                {ref.label} — {ref.detail}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </InfoPopover>
  );
}
