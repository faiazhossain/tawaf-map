import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Status pill marking the product as beta. Uses the warning amber token so it
 * reads as "in progress" while staying distinct from the emerald brand
 * (primary) and reserved gold (pilgrim marker only). Label is Bengali-first
 * per project convention.
 */
export function BetaBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex select-none items-center rounded-pill bg-warning px-2 py-0.5",
        "text-[10px] font-bold uppercase leading-none tracking-wide text-white shadow-sm",
        "ring-1 ring-inset ring-black/5 dark:text-black dark:ring-white/10",
        className
      )}
      title="এটি একটি বিটা সংস্করণ — কিছু ফিচার পরীক্ষামূলক থাকতে পারে"
      aria-label="Beta version"
    >
      Beta
    </span>
  );
}
