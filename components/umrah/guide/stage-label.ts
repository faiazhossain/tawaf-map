import type { UmrahStage } from "@/types/umrah";

/** স্টেজের বাংলা লেবেল (তওয়াফ, সাঈ ইত্যাদি)। বিশুদ্ধ ফাংশন। */
export function stageLabel(stage: UmrahStage): string {
  const map: Record<UmrahStage, string> = {
    prep: "প্রস্তুতি",
    ihram: "ইহরাম",
    travel: "যাত্রা",
    enter: "প্রবেশ",
    tawaf: "তওয়াফ",
    pray: "নামাজ",
    sai: "সাঈ",
    halq: "চুল কাটা",
    done: "সমাপ্ত",
  };
  return map[stage];
}

/** সক্রিয় আনুষ্ঠানিক ধাপে হাঁটার দিকের সংক্ষিপ্ত ইঙ্গিত; প্রযোজ্য না হলে null। */
export function directionHint(stage: UmrahStage): string | null {
  if (stage === "tawaf") return "ঘড়ির বিপরীত দিকে হাঁটুন";
  if (stage === "sai") return "সাফা ও মারওয়ার মধ্যে চলুন";
  return null;
}
