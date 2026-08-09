import { cn } from "@/lib/utils";
import { arcState, type ArcState } from "@/lib/map/umrah-overlay";
import { toBengaliNumber } from "@/lib/utils/bengali-number";

export interface RitualRoundHudProps {
  /** স্টেজের নাম (যেমন "তওয়াফ", "সাঈ")। */
  stageLabel: string;
  /** চক্কর/পাক-এর লেবেল (steps-এর counter.label.bn থেকে)। */
  roundLabel: string;
  /** বর্তমান চক্কর/পাক নম্বর (১-থেকে শুরু)। */
  value: number;
  /** সর্বমোট চক্কর/পাক (তওয়াফ/সাঈ-এ ৭)। */
  max: number;
  /** অবস্থানগত ক্লাস (মানচিত্রের ওভারলে কন্টেইনার থেকে)। */
  className?: string;
}

const DOT_CLASS: Record<ArcState, string> = {
  completed: "bg-emerald-400",
  active: "bg-teal-400 ritual-hud-dot-active",
  future: "bg-slate-600",
};

/**
 * তওয়াফ/সাঈ-এর বর্তমান চক্কর/পাক ট্র্যাকার - মানচিত্রের ওপর সবসময় দৃশ্যমান ব্যাজ।
 * হাজি যে চক্করে আছেন তা নাম ও সংখ্যা দিয়ে এবং পয়েন্ট দিয়ে (সম্পন্ন/সক্রিয়/বাকি) দেখায়।
 * বিশুদ্ধ উপস্থাপনমূলক - কোনো হুক বা পার্শ্বপ্রভাব নেই।
 */
export function RitualRoundHud({
  stageLabel,
  roundLabel,
  value,
  max,
  className,
}: RitualRoundHudProps) {
  const done = value >= max;
  const states: ArcState[] = Array.from({ length: max }, (_, i) =>
    // সম্পূর্ণ হলে শেষ চাপটিও "active" না হয়ে সবুজ দেখাক (arcState শেষটিকে active রাখে)।
    done ? "completed" : arcState(i, value, max)
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none select-none",
        "flex flex-col items-center gap-1.5",
        "px-3.5 py-2 rounded-2xl",
        "bg-slate-900/90 backdrop-blur-xl border border-teal-500/30",
        "shadow-lg",
        className
      )}
    >
      <div className="flex items-baseline gap-2 whitespace-nowrap">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-teal-300">
          {stageLabel}
        </span>
        <span className="text-sm font-bold text-white">
          {roundLabel} {toBengaliNumber(value)} / {toBengaliNumber(max)}
        </span>
      </div>
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {states.map((state, i) => (
          <span key={i} className={cn("h-2 w-2 rounded-full", DOT_CLASS[state])} />
        ))}
      </div>
    </div>
  );
}
