import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { arcState, type ArcState } from "@/lib/map/umrah-overlay";

/**
 * চক্কর/পাকের ৭-পয়েন্ট ইন্ডিকেটর (তওয়াফ ৭ চক্কর / সাঈ ৭ পাক)।
 * সম্পন্ন = সবুজ + টিক, সক্রিয় = টিল + স্পন্দন, ভবিষ্যৎ = ফাঁপা ধূসর।
 * বিশুদ্ধ উপস্থাপনমূলক; অবস্থা arcState থেকে নির্ধারিত।
 */
export function RoundDots({
  value,
  max,
  className,
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const done = value >= max;
  return (
    <div className={cn("flex items-center gap-1.5", className)} aria-hidden="true">
      {Array.from({ length: max }, (_, i) => {
        const state: ArcState = done ? "completed" : arcState(i, value, max);
        return (
          <span
            key={i}
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded-full",
              state === "completed" && "bg-emerald-500 text-white",
              state === "active" && "bg-teal-500 text-white ritual-hud-dot-active",
              state === "future" && "border border-slate-600 bg-transparent"
            )}
          >
            {state === "completed" && <Check className="h-3 w-3" strokeWidth={3} />}
          </span>
        );
      })}
    </div>
  );
}
