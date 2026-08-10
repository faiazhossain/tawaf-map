"use client";

import { Accessibility, ExternalLink } from "lucide-react";
import { useUmrahGuideStore } from "@/lib/store/umrahGuideStore";
import type { UmrahStep } from "@/types/umrah";

/**
 * হুইলচেয়ার-সচেতন পরামর্শ (পরিকল্পনা ৬.৬)
 *
 * অনবোর্ডিংয়ে ব্যবহারকারী হুইলচেয়ার চিহ্নিত করলে প্রাসঙ্গিক ধাপে (প্রবেশ/তওয়াফ/সাঈ)
 * মাটির স্তরের তওয়াফ, নিচতলার সাঈ ও বিনামূল্য/ভাড়া হুইলচেয়ারের তথ্য দেখায়।
 * অন্যথা null।
 */
const TIPS_BY_STAGE: Partial<Record<UmrahStep["stage"], { bn: string }[]>> = {
  enter: [
    {
      bn: "হারামের প্রবেশদ্বারে বিনামূল্যে হুইলচেয়ার পাওয়া যায় — লিফট/এসকেলেটরসহ গেট বেছে নিন।",
    },
  ],
  tawaf: [
    { bn: "তওয়াফ মাটির স্তরে (ground floor) করুন — উপরের তলার চেয়ে সমতল ও সহজ।" },
    { bn: "প্রয়োজনে বৈদ্যুতিক হুইলচেয়ার ভাড়া নিতে পারেন (Assist Haramain)।" },
  ],
  sai: [{ bn: "সাঈ নিচতলার পথে করুন; প্রয়োজনে সাঈ-এর জন্য বিশেষ ট্র্যাক ও সহায়তা আছে।" }],
};

export function WheelchairTips({ stepId }: { stepId: string }) {
  const profile = useUmrahGuideStore((s) => s.profile);
  if (!profile?.accessibility?.wheelchair) return null;

  const step = STEP_BY_ID[stepId];
  if (!step) return null;
  const tips = TIPS_BY_STAGE[step.stage];
  if (!tips || tips.length === 0) return null;

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5">
      <div className="flex items-center gap-2 mb-1.5">
        <Accessibility className="w-4 h-4 text-primary" />
        <p className="text-xs font-medium text-foreground">হুইলচেয়ার সহায়তা</p>
      </div>
      <ul className="space-y-1">
        {tips.map((t, i) => (
          <li key={i} className="text-xs text-foreground leading-relaxed flex gap-1.5">
            <span className="text-primary flex-shrink-0">•</span>
            <span>{t.bn}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        <a
          href="https://ziyarago.com/en/places/rental/equipment-rental-wheelchairs-baby-strollers/free-wheelchair-haram-makkah"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-primary hover:text-primary-hover"
        >
          <ExternalLink className="w-3 h-3" /> বিনামূল্যে হুইলচেয়ার
        </a>
        <a
          href="https://assist.haramain.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-primary hover:text-primary-hover"
        >
          <ExternalLink className="w-3 h-3" /> বৈদ্যুতিক হুইলচেয়ার ভাড়া
        </a>
      </div>
    </div>
  );
}

// stage নির্ধারণের জন্য ধাপ id -> stage ম্যাপ (স্থানীয়; ডেটা আমদানি এড়াতে সংক্ষিপ্ত)
const STEP_BY_ID: Record<string, { stage: UmrahStep["stage"] }> = {
  "enter-haram": { stage: "enter" },
  tawaf: { stage: "tawaf" },
  sai: { stage: "sai" },
};
